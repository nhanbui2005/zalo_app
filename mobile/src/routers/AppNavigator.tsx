import { SplashScreen } from '~/screens/SplashScreen';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider'; 
import { useEffect, useState } from 'react';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './main/MainNavigator';
import { database } from '~/database';

const AppRouters = ({ authData }) => {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsShowSplash(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {isShowSplash ? (
        <SplashScreen />
      ) : authData ? (
        <DatabaseProvider database={database}>
          <MainNavigator />
        </DatabaseProvider>
      ) : (
        <AuthNavigator />
      )}
    </>
  );
};

export default AppRouters;