import api from './api';

export const getLeaveTypes = async () => {
    const response = await api.get('/leave-types/');
    return response.data;
};

export const getMyBalances = async () => {
    const response = await api.get('/leave-balances/');
    return response.data;
};

export const getLeaves = async () => {
    const response = await api.get('/leaves/');
    return response.data;
};

export const createLeave = async (data) => {
    const response = await api.post('/leaves/', data);
    return response.data;
};

export const approveLeave = async (id, commentaire = '') => {
    const response = await api.post(`/leaves/${id}/approve/`, { commentaire });
    return response.data;
};

export const rejectLeave = async (id, commentaire = '') => {
    const response = await api.post(`/leaves/${id}/reject/`, { commentaire });
    return response.data;
};