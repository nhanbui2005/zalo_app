import AxiosInstant from '../config/axiosInstant'

const logoutAPI = async () => {
  try {
    return await AxiosInstant.post('auth/logout')
  } catch (error) {
    
  }
}

const authAPI = {
  logoutAPI
}

export default authAPI