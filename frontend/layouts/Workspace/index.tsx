import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { FC, useCallback } from 'react';
import { Redirect } from 'react-router';
import useSWR from 'swr';

const Workspace: FC = ({ children }) => {
  const { data, error, revalidate, mutate } = useSWR('/api/users', fetcher);

  const onLogOut = useCallback(() => {
    axios.post('/api/users/logout', null, {
      withCredentials: true,
    })
    .then(() => {
      mutate(false);
    })
  }, []);

  if (!data) {
    return <Redirect to="/login" />
  }
  
  return (
    <div>
      <button onClick={onLogOut}>로그아웃</button>
      {children};
    </div>
  )
}

export default Workspace;