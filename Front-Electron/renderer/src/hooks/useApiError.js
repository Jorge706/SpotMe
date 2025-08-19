import { useState } from 'react';

export const useApiError = () => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const extractErrorMessage = (err) => {

        try {
            if (err.message) {
                const parsedError = JSON.parse(err.message);
                return parsedError.message;
            }
        } catch (parseError) {
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
            const errorMessage = extractErrorMessage(err);
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
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);
        setModalMessage(errorMessage);
        setShowModal(true);

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
