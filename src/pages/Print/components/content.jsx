import React, { Fragment } from 'react';
import cx from 'classnames';
import sheetAjax from 'src/api/worksheet';
import './content.less';
import { getPrintContent, sortByShowControls, getVisibleControls, isRelation } from '../util';
import TableRelation from './relationTable';
import { ScrollView, Qr } from 'ming-ui';
import {
  TRIGGER_ACTION,
  OPERATION_LOG_ACTION,
  fromType,
  typeForCon,
  DEFAULT_FONT_SIZE,
  UNPRINTCONTROL,
  TitleFont,
  DefaultNameWidth,
} from '../config';
import { putControlByOrder, replaceHalfWithSizeControls } from 'src/pages/widgetConfig/util';
import { SYSTOPRINTTXT } from '../config';
import { permitList } from 'src/pages/FormSet/config.js';
import { isOpenPermit } from 'src/pages/FormSet/util.js';
import _ from 'lodash';
import moment from 'moment';
import STYLE_PRINT from './exportWordPrintTemCssString';

export default class Con extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      shareUrl: '',
    };
  }

  componentDidMount() {
    this.loadWorksheetShortUrl();
  }

  componentWillReceiveProps(nextProps, nextState) {
    if (_.get(this.props, ['printData', 'shareType']) !== _.get(nextProps, ['printData', 'shareType'])) {
      this.loadWorksheetShortUrl(nextProps);
    }
  }

  loadWorksheetShortUrl = props => {
    let { appId, worksheetId, viewId, rowId, printId, type, from, printType, isDefault, projectId } = this.props.params;
    const { printData } = props || this.props;
    const { shareType = 0, rowIdForQr } = printData;

    // shareType 0 普通=>记录分享 1 对内=>记录详情
    if (shareType === 0) {
      sheetAjax
        .getWorksheetShareUrl({
          worksheetId,
          appId,
          viewId,
          rowId: rowId || rowIdForQr,
          objectType: 2,
          printId,
        })
        .then(({ shareLink }) => {
          let url = shareLink;

          if (type === typeForCon.PREVIEW && isDefault && printId && printType === 'worksheet') {
            url = url.replace('public/record', 'public/print');
            url = `${url}&&${printId}&&${projectId}`;
          }
          this.setState({
            shareUrl: url,
          });
        });
    } else {
      viewId = viewId || undefined;
      let url = `${location.origin}${window.subPath || ''}/app/${appId}/${worksheetId}/${viewId}/row/${
        rowId || rowIdForQr
      }`;
      this.setState({
        shareUrl: url,
      });
    }
  };

  renderControls() {
    const { printData, controls = [] } = this.props;
    let { appId, worksheetId, viewId, rowId, type, from } = this.props.params;
    const { showData, printOption, rowIdForQr, advanceSettings } = printData;
    const nameWidth = (advanceSettings.find(l => l.key === 'nameWidth') || {}).value || DefaultNameWidth;
    let dataInfo = {
      recordId: rowId || rowIdForQr,
      appId,
      worksheetId,
      viewIdForPermit: viewId,
      controls,
    };
    let visibleControls = getVisibleControls(controls);
    const controlData = putControlByOrder(
      replaceHalfWithSizeControls(
        visibleControls
          .filter(l => !l.sectionId || visibleControls.find(o => o.controlId === l.sectionId))
          .filter(o => !UNPRINTCONTROL.includes(o.type)),
      ),
    );
    let isHideNull = !showData && !(from === fromType.FORMSET && type !== typeForCon.PREVIEW);
    const tableList = [];
    let preRelationControls = false;

    Object.keys(controlData).map(key => {
      const item = controlData[key];

      let isRelationControls = item.length === 1 && isRelation(item[0]);

      if (isRelationControls || [22, 52].includes(item[0].type)) {
        tableList.push([item]);
        preRelationControls = true;
      } else if (tableList.length === 0 || preRelationControls) {
        tableList[tableList.length] = [item];
        preRelationControls = false;
      } else {
        tableList[tableList.length - 1].push(item);
        preRelationControls = false;
      }
    });

    const valueWidth = _.floor((728 - nameWidth * 6) / 6);

    return (
      <React.Fragment>
        {tableList.map((tableData, tableIndex) => {
          let isRelationControls = tableData.length === 1 && isRelation(tableData[0][0]);
          //关联表多行列表/子表打印
          if (isRelationControls) {
            const item = tableData[0];

            if (isHideNull) {
              if ([29, 34, 51].includes(item[0].type)) {
                //关联表,子表，是否空值隐藏
                let records = [];
                try {
                  records = JSON.parse(item[0].value);
                } catch (err) {}
                // 子表records不是数组
                if (records.length <= 0) {
                  return null;
                }
              }
            }

            if (
              (!this.isShow(
                getPrintContent({ ...item[0], showData: isHideNull, noUnit: true, ...dataInfo }),
                item[0].checked,
              ) &&
                item[0].type !== 22) ||
              (item[0].type === 22 && !item[0].checked)
            ) {
              return null;
            }

            return this.renderRelations(item[0]);
          }
          let hideNum = 0;
          if ([22, 52].includes(tableData[0][0].type)) {
            let type = tableData[0][0].type;
            let hideTitle = _.get(tableData[0][0], 'advancedSetting.hidetitle') === '1';

            return tableData[0][0].checked ? (
              <p
                style={{
                  lineHeight: 1.5,
                  verticalAlign: top,
                  width: '100%',
                  fontSize: TitleFont[printData.font].fontSize,
                  fontWeight: 'bold',
                  margin: '24px 0 5px',
                  textAlign: type === 52 ? 'center' : 'left',
                }}
              >
                {hideTitle ? '' : tableData[0][0].controlName || ''}
              </p>
            ) : null;
          }
          return (
            <table
              style={{
                ...STYLE_PRINT.table,
                fontSize: printData.font || DEFAULT_FONT_SIZE,
                marginTop: tableIndex === 0 ? 16 : 0,
              }}
              border="0"
              cellPadding="0"
              cellSpacing="0"
            >
              {Array(6)
                .fill(6)
                .map((l, i) => {
                  return (
                    <React.Fragment>
                      <col key={2 * i} width={(2 * i) % 3 === 0 || (2 * i) % 4 === 0 ? nameWidth : valueWidth} />
                      <col
                        key={2 * i + 1}
                        width={(2 * i + 1) % 3 === 0 || (2 * i + 1) % 4 === 0 ? nameWidth : valueWidth}
                      />
                    </React.Fragment>
                  );
                })}
              {Object.keys(tableData).map((key, itemIndex) => {
                const item = tableData[key];
                //一行一个控件的显示
                if (item.length === 1) {
                  const hideTitle = _.get(item[0], 'advancedSetting.hidetitle') === '1';
                  if (isHideNull) {
                    if ([41, 10010, 14, 42].includes(item[0].type) && !item[0].value && !item[0].dataSource) {
                      //富文本、备注、附件、签名，是否空值隐藏0
                      hideNum++;
                      return '';
                    }
                    if ([29, 34].includes(item[0].type)) {
                      //关联表,子表，是否空值隐藏
                      let records = [];
                      try {
                        records = JSON.parse(item[0].value);
                      } catch (err) {}
                      if (records.length <= 0) {
                        hideNum++;
                        return '';
                      }
                    }
                  }
                  if (
                    (!this.isShow(
                      getPrintContent({ ...item[0], showData: isHideNull, noUnit: true, ...dataInfo }),
                      item[0].checked,
                    ) &&
                      item[0].type !== 22) ||
                    (item[0].type === 22 && !item[0].checked)
                  ) {
                    hideNum++;
                    return '';
                  }
                  let expStyle = {
                    borderBottom: '0.1px solid #ddd',
                    borderTop: itemIndex === hideNum ? '0.1px solid #ddd' : 'none',
                  };
                  {
                    /* 备注字段 */
                  }
                  if (item[0].type === 10010 && (item[0].value || item[0].dataSource)) {
                    return (
                      <Fragment>
                        {!hideTitle && (
                          <tr style={STYLE_PRINT.controlDiv}>
                            <td
                              style={{
                                ...STYLE_PRINT.controlDiv_span,
                                ...STYLE_PRINT.controlDiv_span_title,
                                borderBottom: 'none',
                              }}
                              width={'100%'}
                              colSpan={12}
                            >
                              {item[0].controlName}
                            </td>
                          </tr>
                        )}
                        <tr style={STYLE_PRINT.controlDiv}>
                          <td
                            style={{
                              ...STYLE_PRINT.controlDiv_span,
                              ...STYLE_PRINT.controlDiv_span_value,
                              ...expStyle,
                              width: 728 - nameWidth,
                            }}
                            width={'100%'}
                            colSpan={12}
                          >
                            {getPrintContent({
                              ...item[0],
                              showUnit: true,
                              showData: isHideNull,
                              printOption,
                              ...dataInfo,
                            })}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  }

                  return item[0].type !== 10010 ? (
                    <tr style={STYLE_PRINT.controlDiv}>
                      <td
                        width={nameWidth}
                        style={{
                          ...STYLE_PRINT.controlDiv_span,
                          ...STYLE_PRINT.controlDiv_span_title,
                          ...expStyle,
                        }}
                      >
                        {hideTitle ? '' : item[0].controlName}
                      </td>
                      {/* 分割线不计算value 走特殊显示方式 */}
                      <td
                        style={{
                          ...STYLE_PRINT.controlDiv_span,
                          ...STYLE_PRINT.controlDiv_span_value,
                          ...expStyle,
                          width: 728 - nameWidth,
                        }}
                        width={728 - nameWidth}
                        colSpan={11}
                      >
                        {getPrintContent({
                          ...item[0],
                          showUnit: true,
                          showData: isHideNull,
                          printOption,
                          ...dataInfo,
                        })}
                      </td>
                    </tr>
                  ) : null;
                } else {
                  //一行多个控件的显示
                  let data = item.filter(it =>
                    this.isShow(
                      getPrintContent({ ...it, showData: isHideNull, noUnit: true, ...dataInfo }),
                      it.checked,
                    ),
                  );

                  let allCountSize = _.sum(data.map(item => item.size));

                  if (data.length > 0) {
                    return (
                      <React.Fragment>
                        <tr style={STYLE_PRINT.controlDiv} className="trFlex">
                          {data.map((it, i) => {
                            let span = 12 * (it.size / allCountSize);
                            const hideTitle = _.get(it, 'advancedSetting.hidetitle') === '1';
                            return (
                              <React.Fragment>
                                <td
                                  width={nameWidth}
                                  style={{
                                    ...STYLE_PRINT.controlDiv_span,
                                    ...STYLE_PRINT.controlDiv_span_title,
                                    borderLeft: i === 0 ? 'none' : '0.1px solid rgb(221, 221, 221)',
                                    width: `${nameWidth}px`,
                                    borderBottom: '0.1px solid #ddd',
                                    borderTop: itemIndex === hideNum ? '0.1px solid #ddd' : 'none',
                                  }}
                                >
                                  {hideTitle ? '' : it.controlName || _l('未命名')}
                                </td>
                                <td
                                  style={{
                                    ...STYLE_PRINT.controlDiv_span,
                                    ...STYLE_PRINT.controlDiv_span_value,
                                    overflow: 'hidden',
                                    width:
                                      data.length !== 1
                                        ? `${728 * (it.size / allCountSize) - nameWidth}px`
                                        : `${728 - nameWidth}px`,
                                    borderBottom: '0.1px solid #ddd',
                                    borderTop: itemIndex === hideNum ? '0.1px solid #ddd' : 'none',
                                  }}
                                  width={
                                    data.length !== 1
                                      ? `${728 * (it.size / allCountSize) - nameWidth}`
                                      : 728 - nameWidth
                                  }
                                  colSpan={span - 1}
                                >
                                  {getPrintContent({ ...it, showUnit: true, printOption, ...dataInfo })}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  } else {
                    hideNum++;
                    return null;
                  }
                }
              })}
            </table>
          );
        })}
      </React.Fragment>
    );
  }

  renderRelations = tableList => {
    const { printData, handChange, params } = this.props;
    const { type, from } = params;
    const { showData, relationStyle = [], orderNumber = [] } = printData;
    let orderNumberCheck = (orderNumber.find(o => o.receiveControlId === tableList.controlId) || []).checked;
    let relationControls = tableList.relationControls || [];
    let relationsList = tableList.relationsData || {};
    let isHideNull = !showData && !(from === fromType.FORMSET && type !== typeForCon.PREVIEW);
    let list = relationsList.data || [];
    //空置隐藏则不显示
    if (isHideNull && list.length <= 0) {
      return '';
    }
    let controls = [];
    if (tableList.showControls && tableList.showControls.length > 0) {
      //数据根据ShowControls处理
      controls = getVisibleControls(sortByShowControls(tableList));
      //只展示checked
      controls = controls.filter(it => {
        let data = relationControls.find(o => o.controlId === it.controlId) || [];
        if (data.checked && !UNPRINTCONTROL.includes(o.type)) {
          return it;
        }
      });
      //controls数据以relations为准
      controls = controls.map(it => {
        let { template = [] } = relationsList;
        let { controls = [] } = template;
        if (controls.length > 0) {
          let data = controls.find(o => o.controlId === it.controlId) || [];
          return {
            ...it,
            ...data,
            checked: it.checked, //relations 中的checked 是错的
          };
        } else {
          return it;
        }
      });
    }
    //关联表富文本不不显示 分割线 嵌入不显示 扫码47暂不支持关联表显示(表单配置处隐藏了)
    controls = controls.filter(
      it => ![41, 22, 45, 47].includes(it.type) && !(it.type === 30 && it.sourceControlType === 41),
    );
    let relationStyleNum = relationStyle.find(it => it.controlId === tableList.controlId) || [];
    let setStyle = type => {
      let data = [];
      let isData = relationStyle.map(it => it.controlId).includes(tableList.controlId);
      if (isData) {
        relationStyle.map(it => {
          if (it.controlId === tableList.controlId) {
            data.push({
              ...it,
              type: type,
            });
          } else {
            data.push(it);
          }
        });
      } else {
        data = relationStyle;
        data.push({
          controlId: tableList.controlId,
          type: type,
        });
      }
      handChange({
        relationStyle: data,
      });
    };

    let sign = !relationStyleNum.type || relationStyleNum.type === 1;
    const hideTitle = _.get(tableList, 'advancedSetting.hidetitle') === '1';

    return (
      <React.Fragment>
        <p
          style={{
            ..._.assign(STYLE_PRINT.relationsTitle, sign ? STYLE_PRINT.pRelations : {}),
            ...TitleFont[printData.font],
          }}
          className="relationsTitle"
        >
          {hideTitle ? '' : tableList.controlName || _l('未命名')}
          {type !== typeForCon.PREVIEW && (
            <ul
              className="noPrint"
              style={{
                ...STYLE_PRINT.tag,
                float: 'right',
              }}
            >
              <li
                style={{
                  ...STYLE_PRINT.relations_Ul_Li,
                  border: sign ? '0.1px solid #2196f3' : '0.1px solid #bdbdbd',
                  color: sign ? '#2196f3' : '#bdbdbd',
                  zIndex: sign ? 1 : 0,
                }}
                onClick={() => {
                  setStyle(1);
                }}
              >
                {_l('表格')}
              </li>
              <li
                style={{
                  ...STYLE_PRINT.relations_Ul_Li,
                  border: !sign ? '0.1px solid #2196f3' : '0.1px solid #bdbdbd',
                  color: !sign ? '#2196f3' : '#bdbdbd',
                  zIndex: !sign ? 1 : 0,
                }}
                onClick={() => {
                  setStyle(2);
                }}
              >
                {_l('平铺')}
              </li>
            </ul>
          )}
        </p>
        {!relationStyleNum.type || relationStyleNum.type === 1 ? (
          // 表格
          <TableRelation
            dataSource={list}
            controls={controls}
            orderNumberCheck={orderNumberCheck}
            id={tableList.controlId}
            printData={printData}
            handChange={handChange}
            isShowFn={this.isShow}
            showData={isHideNull}
            style={{
              fontSize: printData.font || DEFAULT_FONT_SIZE,
            }}
          />
        ) : (
          // 平铺
          <React.Fragment>
            <div style={{ marginBottom: 24 }}>
              {list.map((o, i) => {
                if (controls.length <= 0) {
                  return '';
                }
                let controlList = controls.filter(it => {
                  let data = {
                    ...it,
                    value: o[it.controlId],
                    isRelateMultipleSheet: true,
                    showUnit: true,
                  };
                  return this.isShow(
                    getPrintContent({
                      ...data,
                      showData: isHideNull,
                      noUnit: true,
                    }),
                    true,
                  );
                });

                return (
                  <React.Fragment>
                    {orderNumberCheck && (
                      <h5
                        style={{
                          ...STYLE_PRINT.relationsList_listCon_h5,
                          fontSize: printData.font || DEFAULT_FONT_SIZE,
                        }}
                      >
                        {tableList.sourceEntityName || _l('记录')} {i + 1}
                      </h5>
                    )}
                    {controlList.length > 0 && (
                      <table
                        width="100%"
                        style={{
                          ...STYLE_PRINT.table,
                          fontSize: printData.font || DEFAULT_FONT_SIZE,
                        }}
                        border="0"
                        cellPadding="0"
                        cellSpacing="0"
                      >
                        {controlList.map((it, index) => {
                          let data = {
                            ...it,
                            value: o[it.controlId],
                            isRelateMultipleSheet: it.type !== 14,
                            showUnit: true,
                          };
                          if ([29].includes(it.type)) {
                            let list = (it.relationControls || []).find(o => o.attribute === 1) || {};
                            if (list.type && ![29, 30].includes(list.type)) {
                              data = { ...data, sourceControlType: list.type, advancedSetting: list.advancedSetting };
                            }
                          }
                          let expStyle =
                            index + 1 === controlList.length
                              ? {
                                  borderBottom: '0.1px solid #ddd',
                                  paddingBottom: 10,
                                }
                              : {
                                  paddingTop: 5,
                                };
                          return (
                            <tr>
                              <td
                                style={{
                                  ...STYLE_PRINT.controlDiv_span_title,
                                  ...expStyle,
                                }}
                              >
                                {it.controlName || _l('未命名')}
                              </td>
                              <td
                                style={{
                                  ...expStyle,
                                  whiteSpace: 'pre-wrap',
                                  verticalAlign: 'top',
                                  paddingLeft: 5,
                                }}
                              >
                                {getPrintContent(data)}
                              </td>
                            </tr>
                          );
                        })}
                      </table>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  signLoadSet = e => {
    $(e.target).attr({
      width: e.target.width,
      height: e.target.height,
    });
  };

  renderApprovalFiles = (files = []) => {
    const images = files.filter(l => File.isPicture(l.ext));
    const others = files.filter(l => !File.isPicture(l.ext));

    return (
      <React.Fragment>
        <div
          style={{
            textAlign: 'center',
            marginTop: 5,
          }}
        >
          {images.map(l => (
            <img
              onLoad={e => {
                let width = e.target.width;
                let height = e.target.height;
                if (width > height) {
                  $(e.target).attr({
                    width: width,
                  });
                } else {
                  $(e.target).attr({
                    height: height,
                  });
                }
              }}
              style={{
                maxWidth: 140,
                maxHeight: 158,
              }}
              src={
                l.previewUrl.indexOf('imageView2') > -1
                  ? l.previewUrl.replace(/imageView2\/\d\/w\/\d+\/h\/\d+(\/q\/\d+)?/, 'imageView2/2/w/600/q/90')
                  : `${l.previewUrl}&imageView2/2/w/600/q/90`
              }
            />
          ))}
        </div>
        <div style={{ marginTop: 4, marginBottom: 0 }}>{others.map(l => l.originalFilename + l.ext).join(', ')}</div>
      </React.Fragment>
    );
  };

  renderWorks = (_works = undefined, _name) => {
    const { printData } = this.props;
    const { workflow = [], processName, approvePosition } = printData;
    const works = _works || workflow;
    const visibleItemLength = works.filter(item => item.checked).length;
    const name = _works ? _name : processName;

    const signatures = this.getApprovalSignatures(works.filter(l => l.checked));
    const deep_signatures = _.chunk(signatures, 5);

    return (
      <div style={{ marginTop: 24 }}>
        {visibleItemLength > 0 && (
          <React.Fragment>
            <div style={{ fontSize: TitleFont[printData.font].fontSize, fontWeight: 'bold', marginBottom: 12 }}>
              {name}
            </div>
            <div className="clearfix" style={{ fontSize: printData.font || DEFAULT_FONT_SIZE }}>
              <div>
                <table
                  className="approvalTable"
                  style={{
                    ...STYLE_PRINT.table,
                    width: '100%',
                    borderSpacing: 0,
                    fontSize: 12,
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          ...STYLE_PRINT.worksTable_workPersons_th,
                          width: '20%',
                          borderTop: '0.1px solid #ddd',
                          backgroundColor: '#fafafa',
                          borderLeft: 0,
                          tableLayout: 'auto',
                        }}
                      >
                        {_l('流程节点')}
                      </td>
                      <td
                        style={{
                          ...STYLE_PRINT.worksTable_workPersons_th,
                          width: '20%',
                          borderTop: '0.1px solid #ddd',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {_l('操作人')}
                      </td>
                      <td
                        style={{
                          ...STYLE_PRINT.worksTable_workPersons_th,
                          width: '12%',
                          borderTop: '0.1px solid #ddd',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {_l('操作')}
                      </td>
                      <td
                        style={{
                          ...STYLE_PRINT.worksTable_workPersons_th,
                          width: '22%',
                          borderTop: '0.1px solid #ddd',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {_l('操作时间')}
                      </td>
                      <td
                        style={{
                          ...STYLE_PRINT.worksTable_workPersons_th,
                          width: '26%',
                          borderTop: '0.1px solid #ddd',
                          backgroundColor: '#fafafa',
                        }}
                      >
                        {approvePosition === 0 ? _l('备注/签名') : _l('备注')}
                      </td>
                    </tr>
                    {works.map((item, index) => {
                      return item.workItems.map((workItem, workItemIndex) => {
                        const { workItemLog, signature } = workItem;
                        if (!item.checked) return null;
                        return (
                          <tr key={`workflow-tr-${index}-${workItemIndex}`}>
                            {workItemIndex === 0 && (
                              <td
                                style={{
                                  ...STYLE_PRINT.worksTable_workPersons_td,
                                  width: '20%',
                                  borderLeft: 0,
                                  borderBottom: '0.1px solid #ddd',
                                }}
                                rowSpan={item.workItems.length}
                              >
                                {item.flowNode.name}
                                {item.multipleLevelType !== 0 && item.sort && ` (${item.sort})`}
                              </td>
                            )}
                            <td
                              style={{
                                ...STYLE_PRINT.worksTable_workPersons_td,
                                width: '20%',
                                borderBottom: '0.1px solid #ddd',
                              }}
                            >
                              <span style={{ verticalAlign: 'middle' }} className="controlName">
                                {workItem.workItemAccount.fullName}
                              </span>
                            </td>
                            <td
                              style={{
                                ...STYLE_PRINT.worksTable_workPersons_td,
                                width: '12%',
                                borderBottom: '0.1px solid #ddd',
                              }}
                            >
                              <span style={{ verticalAlign: 'middle' }} className="controlName">
                                {workItem.type === 0
                                  ? TRIGGER_ACTION[Number(item.flowNode.triggerId)] || OPERATION_LOG_ACTION['0']
                                  : workItem.workItemLog &&
                                    (workItem.workItemLog.action === 5 && workItem.workItemLog.actionTargetName
                                      ? _l('退回到%0', workItem.workItemLog.actionTargetName)
                                      : workItem.workItemLog.action === 22 && workItem.type === 3
                                      ? _l('无需填写')
                                      : OPERATION_LOG_ACTION[workItem.workItemLog.action])}
                              </span>
                            </td>
                            <td
                              style={{
                                ...STYLE_PRINT.worksTable_workPersons_td,
                                width: '22%',
                                borderBottom: '0.1px solid #ddd',
                              }}
                            >
                              <span style={{ verticalAlign: 'middle' }} className="controlName">
                                {workItem.operationTime}
                              </span>
                            </td>
                            <td
                              style={{
                                ...STYLE_PRINT.worksTable_workPersons_td,
                                // width: '26%',
                                borderBottom: '0.1px solid #ddd',
                              }}
                            >
                              {item.flowNode.type !== 5 && (
                                <React.Fragment>
                                  <span style={{ verticalAlign: 'middle' }} className="controlName">
                                    {workItem.opinion}
                                  </span>
                                  {workItemLog &&
                                    workItemLog.fields &&
                                    workItemLog.fields.map(({ name, toValue }) => (
                                      <span>
                                        {name}：{toValue}
                                      </span>
                                    ))}
                                  {signature && !approvePosition ? (
                                    <div
                                      style={STYLE_PRINT.worksTable_workPersons_infoSignature}
                                      className="infoSignature"
                                    >
                                      {signature.server && (
                                        <img src={`${signature.server}`} alt="" srcset="" onLoad={this.signLoadSet} />
                                      )}
                                    </div>
                                  ) : null}
                                  {/* 附件 */}
                                  {workItem.files && this.renderApprovalFiles(workItem.files)}
                                </React.Fragment>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {!!signatures.length && approvePosition > 0 && (
              <React.Fragment>
                <p style={{ marginTop: 20, marginBottom: 10, fontSize: TitleFont[printData.font].fontSize }}>
                  {_l('签名')}
                </p>
                <table
                  className="approvalSignatureTable"
                  style={{
                    ...STYLE_PRINT.table,
                    marginTop: 0,
                    marginBottom: 30,
                    width: 'auto',
                  }}
                  border="0"
                  cellPadding="0"
                  cellSpacing="0"
                >
                  {deep_signatures.map((tdList, index) => {
                    return (
                      <tr key={`approvalSignature-${name}-tr-${index}`}>
                        {[0, 1, 2, 3, 4].map(tdItem => (
                          <td
                            width={160}
                            style={{
                              width: 160,
                              height: 45,
                              paddingRight: tdItem === 4 ? 0 : 32,
                              paddingBottom: index + 1 === deep_signatures.length ? 0 : 10,
                            }}
                          >
                            {tdList[tdItem] ? (
                              <div style={STYLE_PRINT.worksTable_workPersons_infoSignature} className="infoSignature">
                                <img src={`${tdList[tdItem].server}`} alt="" srcset="" onLoad={this.signLoadSet} />
                              </div>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </table>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </div>
    );
  };

  getApprovalSignatures = workList => {
    let signatures = [];
    workList.forEach(item => {
      const signature = _.flatMapDeep(item.workItems, l => {
        return l.signature;
      }).filter(l => l && l.server);
      signatures = signatures.concat(signature);
    });
    return signatures;
  };

  renderApproval = () => {
    const { printData, sheetSwitchPermit, params } = this.props;
    const { viewId } = params;
    const { approval = [], approvePosition } = printData;
    const visibleItem = approval.filter(item => item.child.some(l => l.checked));

    if (!isOpenPermit(permitList.approveDetailsSwitch, sheetSwitchPermit, viewId)) {
      return null;
    }

    return (
      <React.Fragment>
        {visibleItem.length > 0 && (
          <React.Fragment>
            {visibleItem.map((item, index) => {
              return (
                <div className="approval">
                  {item.child.map(l => {
                    let _workList = l.processInfo.works.map(m => {
                      return {
                        ...m,
                        checked: l.checked,
                      };
                    });

                    return <React.Fragment>{this.renderWorks(_workList, l.processInfo.processName)}</React.Fragment>;
                  })}
                </div>
              );
            })}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  getNumSys = () => {
    const { printData } = this.props;
    const list = ['createTime', 'ownerAccount', 'createAccount', 'updateAccount', 'updateTime'];

    return list.filter(o => this.isShow(printData[o], printData[o + 'Checked'])).length;
  };

  isShow = (data, checked) => {
    if (!checked) {
      return false;
    }

    const { printData, params } = this.props;
    const { type, from } = params;
    const { showData } = printData;
    let isHideNull = !showData && !(from === fromType.FORMSET && type !== typeForCon.PREVIEW);
    // 隐藏字段，只在表单编辑中的新建和编辑不生效，仅保存设置
    return !isHideNull || !!data;
  };

  createByNeedWrap = () => {
    const { printData } = this.props;
    let createSign =
      this.isShow(printData.createAccount, printData.createAccountChecked) &&
      this.isShow(printData.createTime, printData.createTimeChecked);
    let updateSign =
      this.isShow(printData.updateAccount, printData.updateAccountChecked) &&
      this.isShow(printData.updateTime, printData.updateTimeChecked);
    if (createSign && updateSign) {
      return false;
    } else if (createSign && this.isShow(printData.ownerAccount, printData.ownerAccountChecked)) {
      return true;
    } else if (updateSign && this.getNumSys() % 2 === 1) {
      return true;
    }
    return false;
  };

  renderSysTable = () => {
    const { printData } = this.props;
    let sysFeild = ['ownerAccount', 'createAccount', 'updateAccount', 'createTime', 'updateTime'].filter(o =>
      this.isShow(printData[o], printData[o + 'Checked']),
    );

    return (
      <p
        className="sysField"
        style={{
          ...STYLE_PRINT.sysField,
          fontSize: printData.font || DEFAULT_FONT_SIZE,
        }}
      >
        {sysFeild.map(it => {
          if (!it) return null;
          return (
            <span>
              {SYSTOPRINTTXT[it]}
              {printData[it]}&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          );
        })}
      </p>
    );
  };

  render() {
    const { loading, shareUrl } = this.state;
    const { printData, controls, signature } = this.props;
    const { workflow = [], approval = [], attributeName, advanceSettings } = printData;
    const formNameSite = (advanceSettings.find(l => l.key === 'formNameSite') || {}).value || '0';
    return (
      <div className="flex">
        {loading ? (
          <LoadDiv className="mTop64" />
        ) : (
          <ScrollView>
            <div className="printContent flex clearfix pTop20" id="printContent">
              {this.isShow(printData.companyName, printData.companyNameChecked) && (
                <p style={STYLE_PRINT.companyName}>
                  {
                    printData.companyName // 公司名称
                  }
                </p>
              )}
              {(printData.logoChecked || printData.formNameChecked || printData.qrCode) && (
                <table style={STYLE_PRINT.table} border="0" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td
                      style={{
                        width: '33.3%',
                      }}
                    >
                      <span style={{ flex: 1, paddingTop: 10 }}>
                        {this.isShow(printData.projectLogo, printData.logoChecked) && (
                          <img src={printData.projectLogo} alt="" height={60} style={STYLE_PRINT.img} />
                        )}
                      </span>
                    </td>
                    <td style={{ width: '33.3%', textAlign: 'center' }}>
                      <span className="WordBreak" style={STYLE_PRINT.reqTitle}>
                        {this.isShow(printData.formName, printData.formNameChecked && formNameSite === '0')
                          ? printData.formName
                          : ''}
                      </span>
                    </td>
                    <td style={{ width: '33.3%', textAlign: 'right' }}>
                      <span style={{ flex: 1, textAlign: 'right' }}>
                        {this.isShow(shareUrl, printData.qrCode) && <Qr content={shareUrl} width={80} height={80} />}
                      </span>
                    </td>
                  </tr>
                </table>
              )}
              {this.isShow(printData.formName, printData.formNameChecked && formNameSite === '1') && (
                <div style={STYLE_PRINT.fromName} className="generalTitle printFormName">
                  {printData.formName}
                </div>
              )}
              {/* 标题 */}
              <p style={STYLE_PRINT.createBy_h6} className="generalTitle">
                {printData.titleChecked && attributeName}
              </p>
              {this.getNumSys() > 0 && this.renderSysTable()}
              {_.isEmpty(controls) ? undefined : this.renderControls()}
              {/* 工作流 */}
              {workflow.length > 0 && this.renderWorks()}
              {approval.length > 0 && this.renderApproval()}
              {/* 签名字段 */}
              {signature.length > 0 && signature.filter(item => item.checked).length > 0 ? (
                <table
                  style={{
                    ...STYLE_PRINT.table,
                    marginTop: 40,
                    marginBottom: 30,
                    width: 'auto',
                    boxSizing: 'content-box',
                  }}
                  border="0"
                  cellPadding="0"
                  cellSpacing="0"
                >
                  {_.chunk(
                    signature.filter(item => this.isShow(item.value, item.checked)),
                    4,
                  ).map((tdList, index) => {
                    return (
                      <tr key={`signature-tr-${index}`} style={{ verticalAlign: 'top' }}>
                        {[0, 1, 2, 3].map(tdIndex => (
                          <td
                            width={168}
                            style={{
                              width: 168,
                              height: 100,
                              paddingRight: tdIndex === 3 ? 0 : 20,
                            }}
                          >
                            {tdList[tdIndex] ? (
                              <React.Fragment>
                                <div
                                  style={{
                                    fontWeight: 'bold',
                                    height: 20,
                                    fontSize: TitleFont[printData.font].fontSize,
                                  }}
                                >
                                  {_.get(tdList[tdIndex], 'advancedSetting.hidetitle') === '1'
                                    ? ''
                                    : tdList[tdIndex].controlName}
                                </div>
                                <div className="infoSignature">
                                  <img
                                    style={{ marginTop: 20 }}
                                    src={tdList[tdIndex].value}
                                    onLoad={this.signLoadSet}
                                  />
                                </div>
                              </React.Fragment>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </table>
              ) : null}
              {(printData.printTime || printData.printAccount) && (
                <p
                  style={{
                    marginTop: 15,
                    textAlign: 'right',
                    width: '100%',
                    fontSize: 13,
                  }}
                  className="printInfo"
                >
                  {printData.printAccount && (
                    <span className="mRight24">
                      {_l('打印人：')}
                      {md.global.Account.fullname}
                    </span>
                  )}
                  {printData.printTime && (
                    <span>
                      {_l(' 打印时间：')}
                      {moment().format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  )}
                </p>
              )}
            </div>
          </ScrollView>
        )}
      </div>
    );
  }
}
