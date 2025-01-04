import AxiosInstant from '../config/axiosInstant'

const loadMoreMessage = async (data) => {
  try {
    const {roomId} = data
    let query = `roomId=${roomId}`
    // if (roomId) {
    //   query += 'roomId='
    // }
    return await AxiosInstant.get(`messages?`+query)
  } catch (error) {
    
  }
}

const messageAPI = {
  loadMoreMessage
}

export default messageAPI