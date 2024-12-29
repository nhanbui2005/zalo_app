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
    console.log('error ');
    
  }
}

const findUserByEmail = async (email) => {
  return await AxiosInstant.get(`users/search?email=${email}`)
}


const userAPI = {
  updateMe,
  getMe,
  findUserByEmail
}

export default userAPI