// import Workspace from '@layouts/Workspace';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Container, DragOver, Header } from './styles';
import gravatar from 'gravatar';
import useSWR, { useSWRInfinite } from 'swr';
import fetcher from '@utils/fetcher';
import { useParams } from 'react-router';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import axios from 'axios';
import { IDM } from '@typings/db';
import makeSection from '@utils/makeSection';
import Scrollbars from 'react-custom-scrollbars';
import useSocket from '@hooks/useSocket';

const DirectMessage = () => {
  const { workspace, id } = useParams<{ workspace: string, id: string }>();

  const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
  const { data: myData } = useSWR('/api/users', fetcher);
  const { data: chatData, mutate: mutateChat, revalidate, setSize } = useSWRInfinite<IDM[]>(
    (index) => `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index + 1}`, fetcher
  )

  const [socket] = useSocket(workspace);

  const isEmpty = chatData?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length -1]?.length < 20) || false;
  const scrollbarRef = useRef<Scrollbars>(null);

  const [chat, onChangeChat, setChat] = useInput('');

  const [dragOver, setDragOver] = useState(false);

  const onSubmitForm = useCallback((e) => {
    e.preventDefault();
    if (chat?.trim() && chatData) {
      const savedChat = chat;
      mutateChat((prevChatData) => {
        prevChatData?.[0].unshift({
          id: (chatData[0][0]?.id || 0) + 1,
          content: savedChat,
          SenderId: myData.id,
          Sender: myData,
          ReceiverId: userData.id,
          Receiver: userData,
          createdAt: new Date(),
        });
        return prevChatData;
      }, false)
        .then(() => {
          setChat('');
          scrollbarRef.current?.scrollToBottom();
        })
      axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
        content: chat,
      })
        .then(() => {
          revalidate();
        })
        .catch(console.error);
    }
  }, [chat, chatData, mutateChat, myData, userData, workspace, id]);

  const onMessage = useCallback((data: IDM) => {
    // id는 상대방 아이디
    if (data.SenderId === Number(id) && myData.id !== Number(id)) {
      mutateChat((chatData) => {
        chatData?.[0].unshift(data);
        return chatData;
      }, false)
        .then(() => {
          if (scrollbarRef.current) {
            if (scrollbarRef.current.getScrollHeight() < scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150) {
              console.log('scrolltobottom!', scrollbarRef.current?.getValues());
              // 약간의 딜레이로 인해 싱크가 안맞는 부분을 위한 settimeout
              setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
              }, 50);
            }
          }
        })
    }
  }, []);

  useEffect(() => {
    socket?.on('dm', onMessage);
    return () => {
      socket?.off('dm', onMessage);
    }
  }, [socket, onMessage])

  // 로딩 시 스크롤 바 제일 아래로
  useEffect(() => {
    if (chatData?.length === 1) {
      scrollbarRef.current?.scrollToBottom();
    }
  }, [chatData]);

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

    axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData)
      .then(() => {
        setDragOver(false);
        revalidate();
      });
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, [])

  if (!userData || !myData ) {
    return null;
  }

  const chatSections = makeSection(chatData ? chatData.flat().reverse() : [])

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <img src={gravatar.url(userData.email, { s: '24px', d:'retro' })} alt={userData.nickname} />
        <span>{userData.nickname}</span>
      </Header>
      <ChatList chatSections={chatSections} scrollRef={scrollbarRef} setSize={setSize} isReachingEnd={isReachingEnd} />
      <ChatBox chat={chat} onChangeChat={onChangeChat} onSubmitForm={onSubmitForm} />
      {dragOver && <DragOver>업로드!</DragOver>}
    </Container>
  )
}

export default DirectMessage;