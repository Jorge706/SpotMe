import { useState } from 'react';

export const useApiError = () => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const extractErrorMessage = (err) => {
        console.log("🔍 Extracting error message from:", err);

        try {
            // El error llega como JSON string en error.message
            if (err.message) {
                const parsedError = JSON.parse(err.message);
                console.log("✅ Parsed error:", parsedError);
                return parsedError.message;
            }
        } catch (parseError) {
            console.log("⚠️ Could not parse error.message as JSON:", parseError);
            return err.message || 'Error desconocido';
        }

        return 'Error desconocido';
    };

    const handleApiCall = async (apiCall, onSuccess, onError) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await apiCall();
            if (onSuccess) {
                onSuccess(result);
            }
            return result;
        } catch (err) {
            console.log("🚨 handleApiCall caught error:", err);
            const errorMessage = extractErrorMessage(err);
            console.log("📝 handleApiCall extracted message:", errorMessage);
            setError(errorMessage);
            setModalMessage(errorMessage);
            setShowModal(true);

            if (onError) {
                onError(err);
            }
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
        setShowModal(false);
        setModalMessage('');
    };

    const handleApiError = (err) => {
        console.error("🚨 handleApiError received:", err);
        console.error("🚨 Error toString():", err.toString());
        console.error("🚨 Error JSON:", JSON.stringify(err, null, 2));

        const errorMessage = extractErrorMessage(err);
        console.log("📝 handleApiError extracted message:", errorMessage);
        console.log("📝 Type of extracted message:", typeof errorMessage);

        setError(errorMessage);
        setModalMessage(errorMessage);
        setShowModal(true);

        console.log("📝 Modal message set to:", errorMessage);
        console.log("📝 Show modal set to: true");
    };

    return {
        error,
        isLoading,
        showModal,
        modalMessage,
        handleApiCall,
        handleApiError,
        clearError
    };
};
