import fetcher from '@utils/fetcher';
import axios from 'axios';
import React, { FC, useCallback } from 'react';
import { Redirect, Route, Switch } from 'react-router';
import useSWR from 'swr';
import { Channels, Chats, Header, MenuScroll, ProfileImg, RightMenu, WorkspaceName, Workspaces, WorkspaceWrapper } from './styles';
import gravatar from 'gravatar';
import loadable from '@loadable/component';

const Channel = loadable(() => import('@pages/Channel'));
const DirectMessage = loadable(() => import('@pages/DirectMessage'));

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
      <Header>
        <RightMenu>
          <span>
            <ProfileImg src={gravatar.url(data.email, { s: '28px', d: 'retro' })} alt={data.nickname} />
          </span>
        </RightMenu>
      </Header>
      <button onClick={onLogOut}>로그아웃</button>
      <WorkspaceWrapper>
        <Workspaces>test</Workspaces>
        <Channels>
          <WorkspaceName>Sleact</WorkspaceName>
          <MenuScroll>
            MenuScroll
          </MenuScroll>
        </Channels>
        <Chats>
          <Switch>
            {/* nested route : 라우트 계층구조가 확실해야 한다. */}
            <Route path='/workspace/channel' component={ Channel } />
            <Route path='/workspace/dm' component={ DirectMessage } />
          </Switch>
        </Chats>

      </WorkspaceWrapper>
      {children}
    </div>
  )
}

export default Workspace;