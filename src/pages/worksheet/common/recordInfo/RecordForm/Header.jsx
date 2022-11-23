import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Tooltip } from 'ming-ui';
import styled from 'styled-components';
import { getDiscussionsCount } from 'src/api/discussion';
import { emitter } from 'worksheet/util';
import IconBtn from './IconBtn';
import SwitchRecord from './SwitchRecord';
import Operates from './Operates';
import { isOpenPermit } from 'src/pages/FormSet/util.js';
import { permitList } from 'src/pages/FormSet/config.js';

const SodeBarIcon = styled(IconBtn)`
  display: flex;
  .discussCount {
    font-size: 14px;
  }
  .text {
    font-size: 13px;
    margin-left: 2px;
  }
`;

export default function InfoHeader(props) {
  const {
    loading,
    sheetSwitchPermit,
    sideVisible,
    recordbase,
    recordinfo,
    iseditting,
    showPrevNext,
    addRefreshEvents,
    refreshRotating,
    currentSheetRows,
    currentIndex,
    hideRecordInfo,
    switchRecord,
    reloadRecord,
    onCancel,
    onUpdate,
    onSubmit,
    onRefresh,
    onDelete,
    onSideIconClick,
    handleAddSheetRow,
    viewId,
    // allowExAccountDiscuss = false, //允许外部用户讨论
    // exAccountDiscussEnum = 0, //外部用户的讨论类型 0：所有讨论 1：不可见内部讨论
  } = props;
  let { header } = props;
  const { isSmall, worksheetId, recordId } = recordbase;
  const rowId = useRef(recordId);
  const [discussCount, setDiscussCount] = useState();
  const discussVisible = isOpenPermit(permitList.recordDiscussSwitch, sheetSwitchPermit, viewId);
  const logVisible = isOpenPermit(permitList.recordLogSwitch, sheetSwitchPermit, viewId);
  const workflowVisible = isOpenPermit(permitList.approveDetailsSwitch, sheetSwitchPermit, viewId);
  const portalNotHasDiscuss = md.global.Account.isPortal && !props.allowExAccountDiscuss; //外部用户且未开启讨论
  const showSodeBar =
    (!md.global.Account.isPortal && (workflowVisible || discussVisible || logVisible)) ||
    (md.global.Account.isPortal && props.allowExAccountDiscuss && discussVisible);
  function loadDiscussionsCount() {
    if (sideVisible || !discussVisible || portalNotHasDiscuss) {
      return;
    }
    let entityType = 0;
    //外部用户且未开启讨论 不能内部讨论
    if (md.global.Account.isPortal && props.allowExAccountDiscuss && props.exAccountDiscussEnum === 1) {
      entityType = 2;
    }
    getDiscussionsCount({
      pageIndex: 1,
      pageSize: 1,
      sourceId: worksheetId + '|' + rowId.current,
      sourceType: 8,
      entityType, // 0 = 全部，1 = 不包含外部讨论，2=外部讨论
    }).then(data => {
      setDiscussCount(data.data);
    });
  }
  useEffect(() => {
    rowId.current = recordId;
    loadDiscussionsCount();
  }, [recordId, props.allowExAccountDiscuss]);
  useEffect(() => {
    emitter.addListener('RELOAD_RECORD_INFO_DISCUSS', loadDiscussionsCount);
    return () => {
      emitter.removeListener('RELOAD_RECORD_INFO_DISCUSS', loadDiscussionsCount);
    };
  }, []);

  if (viewId) {
    header = null;
  }

  // 展开 收起 右侧按钮
  const sideBarBtn = () => {
    return (
      <SodeBarIcon className="Hand ThemeHoverColor3" onClick={onSideIconClick}>
        <span data-tip={sideVisible ? _l('收起') : _l('展开')}>
          <i className={`icon ${sideVisible ? 'icon-sidebar_close' : 'icon-sidebar_open'}`} />
        </span>
        {!sideVisible && !!discussCount && (
          <span className="discussCount">
            {discussCount > 99 ? '99+' : discussCount}
            <span className="text">{_l('条讨论')}</span>
          </span>
        )}
      </SodeBarIcon>
    );
  };

  // 关闭
  const closeBtn = () => {
    return (
      <IconBtn className="Hand ThemeHoverColor3" onClick={onCancel}>
        <i className="icon icon-close" />
      </IconBtn>
    );
  };

  return (
    <div className="recordHeader flexRow Font22" style={{ zIndex: 10 }}>
      {!!header && !loading && (
        <div className="customHeader flex flexRow">
          {React.cloneElement(header, { onSubmit: onSubmit, isSmall })}
          {showSodeBar && sideBarBtn()}
          {closeBtn()}
        </div>
      )}
      {!header && (
        <div className="flex flexRow w100">
          {showPrevNext && (
            <SwitchRecord currentSheetRows={currentSheetRows} currentIndex={currentIndex} onSwitch={switchRecord} />
          )}
          <span
            className={cx('refreshBtn Font20 Gray_9e ThemeHoverColor3 Hand', {
              isLoading: refreshRotating,
              disable: iseditting,
            })}
            onClick={iseditting ? () => {} : onRefresh}
          >
            <Tooltip offset={[0, 0]} text={<span>{_l('刷新')}</span>}>
              <i className="icon icon-task-later" />
            </Tooltip>
          </span>
          {!iseditting ? (
            <Operates
              addRefreshEvents={addRefreshEvents}
              iseditting={iseditting}
              sideVisible={sideVisible}
              recordbase={recordbase}
              recordinfo={recordinfo}
              hideRecordInfo={hideRecordInfo}
              reloadRecord={reloadRecord}
              onDelete={onDelete}
              onUpdate={onUpdate}
              sheetSwitchPermit={sheetSwitchPermit}
              handleAddSheetRow={handleAddSheetRow}
            />
          ) : (
            <div className="flex" />
          )}
          {showSodeBar && sideBarBtn()}
          {closeBtn()}
        </div>
      )}
    </div>
  );
}

InfoHeader.propTypes = {
  loading: PropTypes.bool,
  iseditting: PropTypes.bool,
  sideVisible: PropTypes.bool,
  header: PropTypes.element,
  recordbase: PropTypes.shape({}),
  recordinfo: PropTypes.shape({}),
  sheetSwitchPermit: PropTypes.arrayOf(PropTypes.shape({})),
  refreshRotating: PropTypes.bool,
  showPrevNext: PropTypes.bool,
  currentSheetRows: PropTypes.arrayOf(PropTypes.shape({})),
  currentIndex: PropTypes.number,
  addRefreshEvents: PropTypes.func,
  hideRecordInfo: PropTypes.func,
  switchRecord: PropTypes.func,
  reloadRecord: PropTypes.func,
  onCancel: PropTypes.func,
  onUpdate: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func,
  onSideIconClick: PropTypes.func,
};
