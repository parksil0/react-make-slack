import Chat from '@components/Chat';
import { IDM } from '@typings/db';
import React, { useCallback, useEffect, useRef, VFC } from 'react';
import { ChatZone, Section, StickyHeader } from './styles';
import { Scrollbars } from 'react-custom-scrollbars'

interface Props {
  chatSections: { [key: string]: IDM[] };
}

const ChatList: VFC<Props> = ({ chatSections }) => {
  const scollbarRef = useRef(null);
  const onScroll = useCallback((values) => {
    if (values.scrollTop === 0) {
      console.log('최상단');
    }
  }, []);

  return (
    <ChatZone>
      <Scrollbars autoHide ref={scollbarRef} onScrollFrame={onScroll} >
        {Object.entries(chatSections).map(([date, chats]) => {
          return (
            <Section className={`section-${date}`} key={date} >
              <StickyHeader>
                <button>{date}</button>
              </StickyHeader>
              {chats.map((chat) => {
                return (
                  <Chat key={chat.id} data={chat} />
                )
              })}
            </Section>
          );
        })};
      </Scrollbars>
    </ChatZone>
    
    
  )
}

export default ChatList;