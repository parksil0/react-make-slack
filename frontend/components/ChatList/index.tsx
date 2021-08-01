import Chat from '@components/Chat';
import { IDM, IChat } from '@typings/db';
import React, { forwardRef, RefObject, useCallback, useEffect, useRef, VFC } from 'react';
import { ChatZone, Section, StickyHeader } from './styles';
import { Scrollbars } from 'react-custom-scrollbars'

interface Props {
  chatSections: { [key: string]: (IDM | IChat)[] };
  setSize: (f: (index: number) => number) => Promise<(IDM | IChat)[][] | undefined>;
  isReachingEnd: boolean;
  scrollRef: RefObject<Scrollbars>
}

const ChatList: VFC<Props> = ({ chatSections, setSize, isReachingEnd, scrollRef }) => {
  const scollbarRef = useRef(null);
  const onScroll = useCallback((values) => {
    if (values.scrollTop === 0 && !isReachingEnd) {
      console.log('최상단');
      setSize((prevSize) => prevSize + 1)
        .then(() => {
          scrollRef.current?.scrollTop(scrollRef.current?.getScrollHeight() - values.scrollHeight)
        })
    }
  }, []);

  return (
    <ChatZone>
      <Scrollbars autoHide ref={scrollRef} onScrollFrame={onScroll} >
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