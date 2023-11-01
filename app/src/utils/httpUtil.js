import axios from 'axios';

import * as bulletinUtil from './bulletinUtil';

import urlConstants from '../constants/urlConstants';
import textConstants from '../constants/textConstants';

/**
 * Http Get.
 *
 * @param {*} url
 * @param {*} [params={}]
 * @returns {Promise}
 */
export function get(url, params = {}) {
  const request = {
    method: 'get',
    url: url,
    params: params
  };

  return axios(request);
}

/**
 * Http POST.
 *
 * @param {*} url
 * @param {*} data
 * @returns  {Promise}
 */
export function post(url, data) {
  const request = {
    method: 'post',
    url: url,
    data: data
  };

  return axios(request);
}

/**
 * Http Put.
 *
 * @param {*} url
 * @param {*} data
 * @returns {Promise}
 */
export function put(url, data) {
  const request = {
    method: 'put',
    url: url,
    data: data
  };

  return axios(request);
}

/**
 * Http Delete.
 *
 * @param {*} url
 * @param {*} [data={}]
 * @returns {Promise}
 */
export function remove(url, data = {}) {
  const request = {
    method: 'delete',
    data,
    url
  };

  return axios(request);
}

/**
 * Check the error received and perform action based on it.
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => generateErrorHelper(error)
);

/**
 * Auto adds the bearer token in Authorization Header.
 */
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken') || null;

    if (accessToken !== null || accessToken !== undefined) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

/**
 * Handle error responses.
 *
 * @param {*} error
 * @returns
 */
export function generateErrorHelper(error) {
  const originalRequest = error.config;
  const errorInfo = {
    status:
      error?.response?.data?.details?.status ||
      error?.response?.data?.error?.status ||
      error?.response?.data?.status ||
      error?.response?.status ||
      error?.status,
    message:
      error?.response?.data?.details?.[0]?.message ||
      error?.response?.data?.details?.message ||
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.response?.message ||
      error?.message ||
      error?.response?.statusText ||
      error?.statusText ||
      'Server Error Occurred',
    originalResponse: error
  };

  console.error(errorInfo);

  if (errorInfo.status === textConstants.UNAUTHORIZED_CODE && errorInfo.message === textConstants.ACCESS_TOKEN_EXPIRE) {
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenRequest = {
      method: 'post',
      url: urlConstants.apiBaseUrl + '/refresh',
      data: {
        authorization: 'Bearer ' + refreshToken
      }
    };

    return axios(tokenRequest).then(({ data }) => {
      localStorage.setItem('accessToken', data.accessToken);
      originalRequest.headers.Authorization = 'Bearer ' + data.accessToken;

      return axios(originalRequest);
    });
  } else if (
    originalRequest.url !== urlConstants.googleLoginUrl &&
    ((errorInfo.status === textConstants.UNAUTHORIZED_CODE &&
      errorInfo.message === textConstants.REFRESH_TOKEN_EXPIRE) ||
      (errorInfo.status === textConstants.NOT_FOUND && errorInfo.message === textConstants.USER_NOT_REGISTERED) ||
      (errorInfo.status === textConstants.NOT_FOUND && errorInfo.message === textConstants.TOKEN_NOT_FOUND))
  ) {
    bulletinUtil.logout();
  }

  throw errorInfo;
}
