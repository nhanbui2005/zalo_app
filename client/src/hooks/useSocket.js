import { useEffect } from "react";
import { useSocket } from "../socket/SocketProvider";

const useSocketEvent = (event, callback) => {
  const { on, off } = useSocket();

  useEffect(() => {
    on(event, callback);

    return () => {
      off(event);
    };
  }, [event, callback, on, off]);
};

export default useSocketEvent;
