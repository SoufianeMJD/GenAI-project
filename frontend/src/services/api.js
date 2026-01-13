import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const analyzeImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await api.post('/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const sendChatMessage = async (history, message, caseContext = '') => {
    const response = await api.post('/chat', {
        history,
        message,
        case_context: caseContext,
    });

    return response.data;
};

export const getStatus = async () => {
    const response = await api.get('/status');
    return response.data;
};

export const initializeRAG = async () => {
    const response = await api.post('/init-rag');
    return response.data;
};

export default api;
