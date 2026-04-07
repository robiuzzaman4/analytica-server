import { ApiResponse } from './interfaces/api-response.interface';

type SendResponseOptions<T> = Omit<ApiResponse<T>, 'data'> & {
  data: T | null;
};

export const sendResponse = <T>(
  payload: SendResponseOptions<T>,
): ApiResponse<T> => payload;
