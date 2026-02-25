import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext } from "react";
import { API_BASE_URL } from "../theme/constants";

const LastQuizTakeContext = createContext(null);
const REQUEST_TIMEOUT_MS = 12000;

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const safeJson = async (response) => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

const isAbortError = (err) => err?.name === "AbortError";

export const useLastQuizTake = () => {
    const context = useContext(LastQuizTakeContext);
    if (!context) {
        throw new Error("useLastQuizTake must be used within LastQuizTakeContextProvider");
    }
    return context;
};
export function LastQuizTakeContextProvider({ children }) {

    const progressTrackerById = async (subjectId) => {
        try {
            const user = await AsyncStorage.getItem("auth_user");
            const userId = JSON.parse(user)?.uid
            console.log(userId, subjectId)
            if (!userId || !subjectId) return { success: false, error: "Missing user or subject." };

            const res = await fetch(`${API_BASE_URL}/v2/progress-tracker/${userId}/${subjectId}`);
            if (!res.ok) {
                const errData = await safeJson(res);
                return { success: false, error: errData?.message || "Failed to fetch progress." };
            }

            const json = await safeJson(res);
            const tracker = json?.data?.[0] || null;

            console.log(tracker)
            if (!tracker) return { success: true, tracker: null, topicMap: new Map() };

            const topicMap = new Map();

            for (const topic of tracker.topics || []) {
                const subMap = new Map();

                for (const sub of topic.subTopics || []) {
                    subMap.set(sub.subTopicName.toLowerCase(), sub); // key = lowercased name
                }

                topicMap.set(topic.topicName, { ...topic, subMap }); // key = topicName
            }

            return { success: true, tracker, topicMap };

        } catch (err) {
            console.error("Last quiz date error:", err);
            if (isAbortError(err)) return { success: false, error: "Request timed out. Please refresh." };
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const getTopicProgress = (topicMap, topicId) => {
        if (!topicMap?.has(topicId)) return null;
        return topicMap.get(topicId);
    };

    const getSubTopicProgress = (topicMap, topicId, subTopicName) => {
        if (!topicMap?.has(topicId)) return null;

        const topic = topicMap.get(topicId);

        // find the tracker subtopic by name
        for (const sub of topic.subMap.values()) {
            if (sub.subTopicName.toLowerCase() === subTopicName.toLowerCase()) {
                return sub;
            }
        }

        return null;
    };

    return (
        <LastQuizTakeContext.Provider
            value={{ progressTrackerById, getTopicProgress, getSubTopicProgress }}
        >
            {children}
        </LastQuizTakeContext.Provider>
    );
}