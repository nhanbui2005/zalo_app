import AxiosInstant from '../config/axiosInstant'

const getAllRelationsRequestAPI = async (data) => {
  try {
    return await AxiosInstant.get('relations')
  } catch (error) {
    
  }
}

const sendRequestAddFriendAPI = async (data) => {
  try {
    return await AxiosInstant.post('relations/sent-request', data)
  } catch (error) {
    
  }
}

const handleRequestAddFriendAPI = async (data) => {
  try {
    return await AxiosInstant.post('relations/handle-request', data)
  } catch (error) {
    
  }
}

const relationAPI = {
  sendRequestAddFriendAPI,
  handleRequestAddFriendAPI,
  getAllRelationsRequestAPI
}

export default relationAPI