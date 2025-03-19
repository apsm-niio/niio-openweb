import React, { Fragment } from 'react';
import { getHelpUrl } from 'src/common/helpUrls';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon, Support, Button, ScrollView, SortableList } from 'ming-ui';
import { Drawer } from 'antd';
import * as actions from './redux/actions/columnRules';
import * as columnRules from './redux/actions/columnRules';
import EditBox from './EditBox';
import RuleItem from './RuleItem';
import { hasRuleChanged } from './config';
import cx from 'classnames';
import _ from 'lodash';

const TABS_DISPLAY = [
  {
    text: _l('交互'),
    value: 0,
  },
  {
    text: _l('验证'),
    value: 1,
  },
];
class ColumnRulesCon extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderCon() {
    const { columnRulesListData = [], grabControlRules, selectRules = {}, activeTab } = this.props;
    const totalData =
      (selectRules.ruleId || '').indexOf('-') >= 0 ? columnRulesListData.concat(selectRules) : columnRulesListData;

    const renderData = totalData.filter(i => i.type === activeTab);

    if (!renderData.length) {
      return (
        <div className="emptyColumnRules">
          <span className="emptyIcon">
            <Icon icon="list" className="Gray_bd" />
          </span>
          <span className="Font15 Gray_9e mTop20">{_l('暂无业务规则')}</span>
        </div>
      );
    }

    return (
      <ScrollView className="rulesCon">
        <SortableList
          items={renderData}
          itemKey="ruleId"
          helperClass="columnRuleSortableList"
          onSortEnd={newItems => grabControlRules(newItems)}
          renderItem={({ item }) => (
            <div className="ruleDrabItemContainer">
              <div className={cx('grabIcon')}>
                <Icon icon="drag" className="TxtMiddle Font14"></Icon>
              </div>
              <RuleItem ruleData={item} />
            </div>
          )}
        />
      </ScrollView>
    );
  }

  render() {
    const {
      addColumnRules,
      saveControlRules,
      clearColumnRules,
      selectRules = {},
      activeTab,
      updateActiveTab,
      columnRulesListData,
    } = this.props;
    const isAdd = (selectRules.ruleId || '').indexOf('-') >= 0;
    const tabText = _.get(
      _.find(TABS_DISPLAY, i => i.value === activeTab),
      'text',
    );

    return (
      <Fragment>
        <div className="columnRuleTitle">
          <div className="flexRow">
            <span className="Font17 Bold flex">{_l('业务规则')}</span>
            <div className="addRules" onClick={() => addColumnRules()}>
              <Icon icon="plus" className="mRight3" />
              {_l('添加规则')}
            </div>
          </div>
          <div className="columnRuleTabs">
            {TABS_DISPLAY.map(item => {
              const list = columnRulesListData.filter(i => i.type === item.value);
              return (
                <div
                  className={cx('tabItem', { active: activeTab === item.value })}
                  onClick={() => {
                    if (hasRuleChanged(columnRulesListData, selectRules)) return;
                    selectRules.ruleId && clearColumnRules();
                    updateActiveTab(item.value);
                  }}
                >
                  {item.text}
                  {list.length > 0 && <span className='mLeft3'>({list.length})</span>}
                </div>
              );
            })}
          </div>
          <div className="columnRuleDesc">
            <span className="Gray_9e">
              {activeTab === 0
                ? _l('交互规则可以根据条件实时控制指定字段的显隐、是否可编辑、是否必填等属性。')
                : _l('验证规则可以规范数据的录入。当满足条件时，禁止保存记录并对指定字段提示错误。')}
            </span>
            <Support type={3} text={_l('帮助')} href={getHelpUrl('worksheet', 'businessRule')} />
          </div>
        </div>

        {this.renderCon()}

        {selectRules.ruleId && (
          <Drawer
            className="columnRulesDrawerContainer"
            width={640}
            title={<span>{isAdd ? _l('新建%0规则', tabText) : _l('编辑%0规则', tabText)}</span>}
            placement="right"
            mask={false}
            onClose={() => clearColumnRules()}
            visible={true}
            getContainer={false}
            closeIcon={<i className="icon-close Font20" />}
            footer={
              <div className="ruleFooter">
                <Button className="mRight15 saveBtn" size="medium" onClick={() => saveControlRules()}>
                  {_l('确定')}
                </Button>
                <Button size="medium" type="secondary" className="closeBtn" onClick={() => clearColumnRules()}>
                  {_l('取消')}
                </Button>
              </div>
            }
          >
            <EditBox />
          </Drawer>
        )}
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  columnRulesListData: state.formSet.columnRulesListData,
  selectRules: state.formSet.selectRules,
  activeTab: state.formSet.activeTab,
});
const mapDispatchToProps = dispatch => bindActionCreators({ ...actions, ...columnRules }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ColumnRulesCon);
