import React, { useState } from 'react';
import sheetAjax from 'src/api/worksheet';
import cx from 'classnames';
import { isPublicLink } from '../tools/utils';
import { FROM } from '../tools/config';
import _ from 'lodash';
import { browserIsMobile } from 'src/util';
import { Tooltip } from 'antd';

export default props => {
  const { disabledFunctions = [], from, recordId, item, worksheetId, disabled, onChange } = props;
  const [isRefresh, setRefresh] = useState(false);
  const isMobile = browserIsMobile();

  const showRefreshBtn =
    !disabledFunctions.includes('controlRefresh') &&
    from !== FROM.DRAFT &&
    !isPublicLink() &&
    recordId &&
    !recordId.includes('default') &&
    !recordId.includes('temp') &&
    md.global.Account.accountId &&
    ((item.type === 30 && (item.strDefault || '').split('')[0] !== '1') || _.includes([31, 32, 37, 38, 53], item.type));

  if (!showRefreshBtn) return null;

  return (
    <Tooltip title={isMobile ? '' : isRefresh ? _l('刷新中...') : _l('刷新')} placement="top">
      <span
        className={cx('Font14 mLeft5 Gray_9e pointer RefreshBtn', { ThemeHoverColor3: !isMobile })}
        onClick={() => {
          if (isRefresh) return;

          setRefresh(true);

          sheetAjax.refreshSummary({ worksheetId, rowId: recordId, controlId: item.controlId }).then(data => {
            if (item.value !== data) {
              onChange(data, item.controlId, item);
            }
            if (isMobile) {
              alert(_l('刷新成功'));
            }
            setRefresh(false);
          });
        }}
      >
        <i className={cx('icon-workflow_cycle', { isLoading: isRefresh })} />
      </span>
    </Tooltip>
  );
};
