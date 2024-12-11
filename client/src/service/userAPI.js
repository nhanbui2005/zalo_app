import AxiosInstant from '../config/axiosInstant'

const updateMe = async (data) => {
  try {
    const response = await AxiosInstant.put('users/me', data)
    return response
  } catch (error) {
    
  }
}

const getMe = async () => {
  try {
    return await AxiosInstant.get('users/me')
  } catch (error) {
    
  }
}

const userAPI = {
  updateMe,
  getMe
}

export default userAPI