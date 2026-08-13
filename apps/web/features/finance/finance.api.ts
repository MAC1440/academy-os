import { baseApi, type ApiRecord } from '@web/store/api/base-api';
export const financeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStudentFinance: build.query<ApiRecord, string>({
      query: (studentId) => `/students/${studentId}/finance`,
      providesTags: ['Academic'],
    }),
    createPayment: build.mutation<
      ApiRecord,
      {
        studentId: string;
        amount: number;
        receiptNumber: string;
        receivedOn: string;
        remarks?: string;
      }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/students/${studentId}/finance/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Academic'],
    }),
    updatePayment: build.mutation<
      ApiRecord,
      {
        studentId: string;
        paymentId: string;
        amount?: number;
        receiptNumber?: string;
        receivedOn?: string;
        remarks?: string;
      }
    >({
      query: ({ studentId, paymentId, ...body }) => ({
        url: `/students/${studentId}/finance/payments/${paymentId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Academic'],
    }),
    deletePayment: build.mutation<void, { studentId: string; paymentId: string }>({
      query: ({ studentId, paymentId }) => ({
        url: `/students/${studentId}/finance/payments/${paymentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Academic'],
    }),
  }),
});
export const {
  useGetStudentFinanceQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} = financeApi;
