import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import useSocket from '@hooks/useSocket';
import Workspace from '@layouts/Workspace';
import { IChannel, IChat, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import makeSection from '@utils/makeSection';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Scrollbars from 'react-custom-scrollbars';
import { useParams } from 'react-router';
import useSWR, { useSWRInfinite } from 'swr';
import { Container, DragOver, Header } from './styles';
import gravatar from 'gravatar';
import InviteChannelModal from '@components/InviteChannelModal';

const Channel = () => {
  const { workspace, channel } = useParams<{ workspace: string, channel: string }>();

  const { data: myData } = useSWR('/api/users', fetcher);
  const { data: channelData } = useSWR<IChannel>(`/api/workspaces/${workspace}/channels/${channel}`, fetcher);
  const { data: chatData, mutate: mutateChat, revalidate, setSize } = useSWRInfinite<IChat[]>(
    (index) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=20&page=${index + 1}`, fetcher
  );
  const { data: channelMembersData } = useSWR<IUser[]>(
    myData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null, fetcher
  );

  const [socket] = useSocket(workspace);

  const isEmpty = chatData?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length -1]?.length < 20) || false;
  const scrollbarRef = useRef<Scrollbars>(null);

  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [chat, onChangeChat, setChat] = useInput('');

  const onSubmitForm = useCallback((e) => {
    e.preventDefault();
    if (chat?.trim() && chatData && channelData) {
      const savedChat = chat;
      mutateChat((prevChatData) => {
        prevChatData?.[0].unshift({
          id: (chatData[0][0]?.id || 0) + 1,
          content: savedChat,
          UserId: myData.id,
          User: myData,
          ChannelId: channelData.id,
          Channel: channelData,
          createdAt: new Date(),
        });
        return prevChatData;
      }, false)
        .then(() => {
          setChat('');
          scrollbarRef.current?.scrollToBottom();
        })
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
        content: chat,
      })
        .then(() => {
          revalidate();
        })
        .catch(console.error);
    }
  }, [chat, chatData, mutateChat, channelData, workspace, channel]);

  const onMessage = useCallback((data: IChat) => {
    if (data.Channel.name === channel && (data.UserId !== myData?.id || data.content.startsWith('uploads\\'))) {
      mutateChat((chatData) => {
        chatData?.[0].unshift(data);
        return chatData;
      }, false)
        .then(() => {
          if (scrollbarRef.current) {
            if (scrollbarRef.current.getScrollHeight() < scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150) {
              console.log('scrolltobottom!', scrollbarRef.current?.getValues());
              setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
              }, 50);
            }
          }
        })
    }
  }, [channel, myData]);

  useEffect(() => {
    socket?.on('message', onMessage);
    return () => {
      socket?.off('message', onMessage);
    }
  }, [socket, onMessage])

  // 로딩 시 스크롤 바 제일 아래로
  useEffect(() => {
    if (chatData?.length === 1) {
      scrollbarRef.current?.scrollToBottom();
    }
  }, [chatData])

  const onClickInviteChannel = useCallback(() => {
    setShowInviteChannelModal(true);
  }, [])

  const onCloseModal = useCallback(() => {
    setShowInviteChannelModal(false);
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const formData = new FormData();
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          formData.append('image', file);
        }
      }
    } else {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        formData.append('image', e.dataTransfer.files[i]);
      }
    }

    axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData)
      .then(() => {
        setDragOver(false);
        revalidate();
      });
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, [])

  if (!myData || !myData ) {
    return null;
  }

  const chatSections = makeSection(chatData ? chatData.flat().reverse() : [])

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <span>#{channel}</span>
        <div className="header-right">
          <span>{channelMembersData?.length}</span>
          <button 
            onClick={onClickInviteChannel}
            className="c-button-unstyled p-ia__view_header__button"
            aria-label="Add people to #react-native"
            data-sk="tooltop_parent"
            type="button"
          >
            <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
          </button>
        </div>
      </Header>
      <ChatList chatSections={chatSections} scrollRef={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd} />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
      {dragOver && <DragOver>업로드!</DragOver>}
    </Container>
  )
}

export default Channel;