import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { arrayOf, func, string } from 'prop-types';
import { UserHead } from 'ming-ui';
import { getTabTypeBySelectUser } from 'src/pages/worksheet/common/WorkSheetFilter/util';
import { quickSelectUser, dialogSelectUser } from 'ming-ui/functions';
import _ from 'lodash';

const Con = styled.div`
  display: flex;
  align-items: center;
  min-height: 32px;
  line-height: 32px;
  border: 1px solid #dddddd;
  border-radius: 4px;
  border: 1px solid ${({ active }) => (active ? '#2196f3' : '#ddd')} !important;
  .clearIcon {
    display: none;
  }
  &:hover {
    .clearIcon {
      display: inline-block;
    }
  }
  ${({ isEmpty }) => (!isEmpty ? '&:hover { .downIcon { display: none;} }' : '')}
`;

const UsersCon = styled.div`
  cursor: pointer;
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  min-height: 32px;
  padding: 0 0 0 10px;
`;

const UserItem = styled.div`
  font-size: 13px;
  display: inline-block;
  color: #333;
  background: #e5e5e5;
  height: 24px;
  line-height: 24px;
  border-radius: 24px;
  padding-right: 8px;
  margin: 4px 6px 0 0;
  .userHead {
    display: inline-block !important;
    margin-right: 6px;
    vertical-align: top;
    img {
      vertical-align: unset;
    }
  }
`;

const SingleUserItem = styled.div`
  font-size: 13px;
  color: #333;
  .userHead {
    display: inline-block !important;
    margin-right: 8px;
  }
`;

const Icon = styled.i`
  cursor: pointer;
  font-size: 13px;
  color: #9e9e9e;
  margin-right: 8px;
`;

const Empty = styled.span`
  color: #bdbdbd;
`;
export default function Users(props) {
  const { values = [], projectId, isMultiple, advancedSetting = {}, onChange = () => {}, appId, from } = props;
  const { shownullitem, nullitemname, navshow, navfilters } = advancedSetting;
  const [active, setActive] = useState();
  const conRef = useRef();
  const tabType = getTabTypeBySelectUser(props.control);
  let staticAccounts = [];

  const emptyAvatar =
    md.global.FileStoreConfig.pictureHost.replace(/\/$/, '') +
    '/UserAvatar/undefined.gif?imageView2/1/w/100/h/100/q/90';

  if (navshow === '2') {
    staticAccounts = safeParse(navfilters)
      .map(safeParse)
      .map(u => ({
        accountId: (u || {}).id,
        fullname: (u || {}).name,
        avatar: (u || {}).avatar,
      }));
  }

  const handleClick = () => {
    const selectIds = values.map(l => l.accountId);

    setActive(true);
    if (from === 'NavShow') {
      dialogSelectUser({
        title: '添加成员',
        sourceId: 0,
        fromType: 0,
        showMoreInvite: false,
        SelectUserSettings: {
          includeUndefinedAndMySelf: true,
          filterResigned: false,
          // includeSystemField: true,
          showMoreInvite: false,
          projectId,
          unique: !isMultiple,
          selectedAccountIds: selectIds,
          callback(users) {
            onChange({ values: isMultiple ? _.uniqBy([...values, ...users], 'accountId') : users });
            setActive(false);
          },
        },
      });
    } else {
      quickSelectUser(conRef.current, {
        showMoreInvite: false,
        isTask: false,
        tabType,
        appId,
        includeUndefinedAndMySelf: true,
        includeSystemField: true,
        offset: {
          top: 4,
          left: -1,
        },
        zIndex: 10001,
        filterAccountIds: [md.global.Account.accountId],
        selectedAccountIds: selectIds,
        staticAccounts: (shownullitem === '1'
          ? [
              {
                avatar: emptyAvatar,
                fullname: nullitemname || _l('为空'),
                accountId: 'isEmpty',
              },
            ]
          : []
        ).concat(staticAccounts),
        SelectUserSettings: {
          projectId,
          unique: !isMultiple,
          filterResigned: false,
          callback(users) {
            onChange({ values: isMultiple ? _.uniqBy([...values, ...users], 'accountId') : users });
            setActive(false);
          },
        },
        selectCb(users) {
          onChange({ values: isMultiple ? _.uniqBy([...values, ...users], 'accountId') : users });
          setActive(false);
        },
        onClose: () => {
          setActive(false);
        },
      });
    }
  };

  return (
    <Con className={props.className} isEmpty={!values.length} active={active} onClick={handleClick}>
      <UsersCon ref={conRef}>
        {!values.length && <Empty>{_l('请选择')}</Empty>}
        {!isMultiple && !!values.length ? (
          <SingleUserItem>
            <UserHead
              className="userHead"
              user={{
                userHead: values[0].avatar || emptyAvatar,
                accountId: values[0].accountId,
              }}
              size={24}
              appId={appId}
              projectId={projectId}
            />
            {values[0].fullname || _l('为空')}
          </SingleUserItem>
        ) : (
          values.map(user => {
            if (user.accountId === 'isEmpty' && !user.avatar && !user.fullname) {
              user.avatar = emptyAvatar;
              user.fullname = _l('为空');
            }
            return (
              <UserItem className="ellipsis">
                <UserHead
                  className="userHead"
                  user={{
                    userHead: user.avatar,
                    accountId: user.accountId,
                  }}
                  size={24}
                  appId={appId}
                  projectId={projectId}
                />
                {user.fullname}
                <i
                  className="icon icon-delete Gray_9e Font10 mLeft6 Hand"
                  onClick={e => {
                    e.stopPropagation();
                    onChange({ values: values.filter(v => v.accountId !== user.accountId) });
                  }}
                />
              </UserItem>
            );
          })
        )}
      </UsersCon>
      <Icon className="icon icon-arrow-down-border downIcon" />
      {!!values.length && (
        <Icon
          className="icon icon-cancel clearIcon"
          onClick={e => {
            e.stopPropagation();
            onChange({ values: [] });
          }}
        />
      )}
    </Con>
  );
}

Users.propTypes = {
  projectId: string,
  values: arrayOf(string),
  onChange: func,
};
