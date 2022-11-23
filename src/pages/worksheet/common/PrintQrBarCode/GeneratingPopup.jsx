import React, { useEffect, useRef, useState } from 'react';
import PDFObject from 'pdfobject';
import styled from 'styled-components';
import { FlexCenter, rotate } from 'worksheet/components/Basics';

const Con = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  z-index: 999;
`;

const Header = styled.div`
  display: flex;
  height: 50px;
  padding: 0 10px 0 20px;
  background-color: #fff;
  justify-content: space-between;
  box-shadow: 0px 1px 3px #00000029;
  z-index: 2;
  .name {
    font-size: 17px;
    line-height: 50px;
    font-weight: bold;
    color: #333333;
    max-width: 100%;
  }
  .close {
    cursor: pointer;
    font-size: 24px;
    line-height: 50px;
    padding: 0 10px;
    color: #444;
    &:hover {
      color: #222;
    }
  }
`;

const Body = styled(FlexCenter)`
  flex: 1;
  background: #eaeaea;
`;

const Loading = styled.div`
  text-align: center;
  color: #9e9e9e;
  .icon {
    display: inline-block;
    font-size: 24px;
    animation: ${rotate} 0.6s infinite linear;
  }
  p {
    font-size: 14px;
    margin-top: 5px;
  }
`;

const Embed = styled.div`
  width: 100%;
  height: 100%;
  ${({ loading }) => (loading ? 'display: none;' : '')}
`;

export default function GeneratingPopup(props) {
  const { name = _l('打印'), loading, embedUrl, onClose = () => {} } = props;
  const embedRef = useRef();
  useEffect(() => {
    if (embedUrl) {
      PDFObject.embed(embedUrl, embedRef.current);
    }
  }, [loading]);
  function handleKeyDown(e) {
    e.stopPropagation();
    if (e.keyCode === 27) {
      onClose();
    }
  }
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  return (
    <Con className="doNotTriggerClickAway" style={props.zIndex ? { zIndex: props.zIndex } : {}}>
      <Header>
        <span className="name ellipsis">{name}</span>
        <i className="icon icon-close close" onClick={onClose}></i>
      </Header>
      <Body>
        {loading && (
          <Loading>
            <i className="icon icon-loading_button"></i>
            <p>{_l('正在生成打印文件···')}</p>
          </Loading>
        )}
        <Embed loading={loading} ref={embedRef} />
      </Body>
    </Con>
  );
}
