import React, { Fragment, useEffect } from 'react';
import { RadioGroup, Dropdown } from 'ming-ui';
import { SettingItem } from '../../styled';
import { getAdvanceSetting, handleAdvancedSettingChange } from '../../util/setting';
import _ from 'lodash';

const DISPLAY_OPTIONS = [
  {
    text: _l('日期'),
    value: 15,
  },
  {
    text: _l('日期时间'),
    value: 16,
  },
];

const DATE_DISPLAY_OPTION = [
  {
    value: '5',
    text: _l('年'),
  },
  { value: '4', text: _l('年-月') },
  { value: '3', text: _l('年-月-日') },
];

const DATE_TIME_DISPLAY_OPTION = [
  {
    value: '2',
    text: _l('年-月-日 时'),
  },
  { value: '1', text: _l('年-月-日 时:分') },
  { value: '6', text: _l('年-月-日 时:分:秒') },
];

export default function Text(props) {
  const { data, onChange } = props;
  const { type, enumDefault2 } = data;
  const { showtype } = getAdvanceSetting(data);
  const isFormulateDate = type === 53 && enumDefault2 === 15;
  const types = data.type === 15 || isFormulateDate ? DATE_DISPLAY_OPTION : DATE_TIME_DISPLAY_OPTION;

  useEffect(() => {
    // 年、年-月类型隐藏星期、时段、分钟间隔
    if (_.includes(['4', '5'], showtype)) {
      onChange(handleAdvancedSettingChange(data, { allowweek: '', allowtime: '', timeinterval: '' }));
    }
  }, [showtype]);

  return (
    <Fragment>
      {type !== 53 && (
        <SettingItem>
          <div className="settingItemTitle">{_l('类型')}</div>
          <RadioGroup
            size="middle"
            checkedValue={data.type}
            data={DISPLAY_OPTIONS}
            onChange={value =>
              onChange({ ...handleAdvancedSettingChange(data, { showtype: value === 15 ? '3' : '1' }), type: value })
            }
          />
        </SettingItem>
      )}
      <SettingItem>
        <Dropdown
          border
          data={types}
          value={showtype}
          onChange={value => onChange(handleAdvancedSettingChange(data, { showtype: value }))}
        />
      </SettingItem>
    </Fragment>
  );
}
