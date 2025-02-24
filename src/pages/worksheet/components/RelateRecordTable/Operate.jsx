import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { bool, func, shape, string } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Motion, spring } from 'react-motion';
import { Input, Dialog } from 'ming-ui';
import { get, last, find, isUndefined } from 'lodash';
import cx from 'classnames';
import styled from 'styled-components';
import { emitter } from 'worksheet/util';
import moment from 'moment';
import { RECORD_INFO_FROM } from 'worksheet/constants/enum';
import addRecord from 'worksheet/common/newRecord/addRecord';
import { selectRecord } from 'src/components/recordCardListDialog';
import { openRelateRelateRecordTable } from 'worksheet/components/RelateRecordTableDialog';
import RecordInfoContext from 'worksheet/common/recordInfo/RecordInfoContext';
import ExportSheetButton from 'worksheet/components/ExportSheetButton';
import Pagination from 'worksheet/components/Pagination';
import { exportRelateRecordRecords } from 'src/pages/worksheet/common/recordInfo/crtl';
import RelateRecordBtn from './RelateRecordBtn';
import { getTranslateInfo } from 'src/util';
import * as actions from './redux/action';
import { arrayOf } from 'prop-types';
import { initialChanges } from './redux/reducer';

const Con = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  line-height: 36px;
  ${({ smallMode }) => smallMode && 'display: block;'}
  .searchIcon {
    position: relative;
    z-index: 2;
    .icon-search {
      position: relative;
      margin: 5px 0 0;
    }
    .searchInput {
      font-size: 0px;
      overflow: hidden;
      background: #eaeaea;
      height: 28px;
      border-radius: 28px;
      input {
        width: 150px;
        margin-left: 30px;
        padding-left: 0px;
        height: 28px;
        line-height: 28px;
        font-size: 12px;
        border: none;
        background: transparent;
      }
    }
    .clearKeywords {
      cursor: pointer;
      margin: 5px;
      position: absolute;
      right: 0px;
    }
  }
`;

const IconBtn = styled.span`
  color: #9e9e9e;
  display: inline-block;
  height: 28px;
  font-size: 20px;
  line-height: 28px;
  padding: 0 4px;
  border-radius: 5px;
  &:hover {
    background: #f7f7f7;
  }
`;

function AnimatedInput(props) {
  const { className, control, onSearch } = props;
  const inputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [keywords, setKeywords] = useState(props.keywords);
  useLayoutEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);
  useEffect(() => {
    if (keywords && !props.keywords) {
      setKeywords('');
    }
  }, [props.keywords]);
  useEffect(() => {
    if (!keywords && props.keywords) {
      setKeywords(props.keywords);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [props.control.controlId]);
  return (
    <Motion
      defaultStyle={{ width: 0, opacity: 0, iconLeft: 0 }}
      style={{
        width: spring(visible ? 180 : 0),
        opacity: spring(visible ? 1 : 0),
        iconLeft: spring(visible ? 27 : 0),
      }}
    >
      {value =>
        !visible ? (
          <span data-tip={_l('搜索')} style={{ height: 28, marginRight: 6 }}>
            <IconBtn className="Hand ThemeHoverColor3" onClick={() => setVisible(true)}>
              <i className="icon icon-search"></i>
            </IconBtn>
          </span>
        ) : (
          <div className={cx('searchIcon flexRow', className)}>
            <i className="icon icon-search Gray_9e Font20 Hand" style={{ left: value.iconLeft }}></i>
            <div
              className="searchInput"
              style={{ width: value.width, backgroundColor: `rgba(234, 234, 234, ${value.opacity})` }}
            >
              <Input
                manualRef={inputRef}
                placeholder={_l('搜索') + '"' + control.controlName + '"'}
                value={keywords}
                onChange={setKeywords}
                onBlur={() => {
                  if (!props.keywords && !keywords && visible) {
                    setVisible(false);
                  }
                }}
                onKeyDown={e => {
                  if (e.keyCode === 13) {
                    onSearch(keywords);
                  }
                }}
              />
              {props.keywords && visible && (
                <i
                  className="icon icon-cancel Gray_9e Font16 clearKeywords"
                  onClick={e => {
                    e.stopPropagation();
                    setKeywords('');
                    onSearch('');
                    setVisible(false);
                  }}
                ></i>
              )}
            </div>
          </div>
        )
      }
    </Motion>
  );
}

AnimatedInput.propTypes = {
  control: shape({}),
  className: string,
  keywords: string,
  onSearch: func,
};

function Operate(props) {
  const {
    mode,
    cache,
    smallMode,
    style,
    className,
    base = {},
    tableState = {},
    recordTitle,
    formData,
    changes = {},
    records,
    appendRecords,
    handleAddRelation,
    handleRemoveRelation,
    updatePageIndex,
    updatePageSize,
    refresh,
    search,
    updateTableState,
    handleOpenRecordInfo,
    updateWorksheetControls,
    deleteOriginalRecords,
    updateBase,
    isDraft,
  } = props;
  const { addedRecords } = changes;
  const {
    from,
    appId,
    viewId,
    control,
    allowEdit,
    searchMaxCount,
    worksheetId,
    recordId,
    addVisible,
    relateWorksheetInfo,
    selectVisible,
    allowRemoveRelation,
    allowDeleteFromSetting,
    allowExportFromSetting,
  } = base;
  const {
    tableLoading,
    keywords,
    pageIndex,
    pageSize,
    count,
    isBatchEditing,
    selectedRowIds,
    countForShow,
    filterControls = [],
  } = tableState;
  const allowBatchEdit = base.allowBatchEdit && !!records.length;
  useEffect(() => {
    emitter.emit(`relationSearchCount:${recordId}:${control.controlId}`, count);
  }, [count]);
  return (
    <Con className={className} style={style} smallMode={smallMode}>
      {(addVisible || selectVisible || allowBatchEdit) && (
        <RelateRecordBtn
          btnVisible={{
            enterBatchEdit: allowBatchEdit,
            removeRelation: allowRemoveRelation,
            deleteRecords: !!recordId && allowDeleteFromSetting,
            exportRecords:
              allowExportFromSetting &&
              !!recordId &&
              from !== RECORD_INFO_FROM.DRAFT &&
              control.recordInfoFrom !== RECORD_INFO_FROM.WORKFLOW,
          }}
          isBatchEditing={isBatchEditing}
          entityName={
            getTranslateInfo(appId, null, control.dataSource).recordName ||
            relateWorksheetInfo.entityName ||
            control.sourceEntityName ||
            ''
          }
          addVisible={addVisible}
          selectVisible={selectVisible}
          selectedRowIds={selectedRowIds}
          onNew={() => {
            addRecord({
              worksheetId: control.dataSource,
              masterRecord: base.saveSync
                ? {
                    rowId: recordId,
                    controlId: control.controlId,
                    worksheetId,
                  }
                : undefined,
              defaultRelatedSheet: control.type !== 51 && {
                worksheetId,
                relateSheetControlId: control.controlId,
                value: actions.getDefaultRelatedSheetValue(formData, recordId),
              },
              needCache: recordId || worksheetId !== control.dataSource,
              directAdd: true,
              showFillNext: true,
              isDraft,
              onAdd: record => {
                if (record) {
                  appendRecords([record]);
                }
              },
              openRecord: id => handleOpenRecordInfo({ recordId: id }),
              handleAddRelation:
                control.type === 29
                  ? selectedRecords => {
                      handleAddRelation(selectedRecords);
                    }
                  : undefined,
            });
          }}
          onSelect={() => {
            selectRecord({
              canSelectAll: true,
              multiple: true,
              control: { ...control, recordId: recordId },
              allowNewRecord: false,
              viewId: control.viewId,
              parentWorksheetId: worksheetId,
              controlId: control.controlId,
              recordId,
              relateSheetId: relateWorksheetInfo.worksheetId,
              isDraft: from === RECORD_INFO_FROM.DRAFT || control.from === RECORD_INFO_FROM.DRAFT,
              filterRowIds: [recordId].concat(
                recordId && from !== 21 && base.saveSync
                  ? []
                  : (base.saveSync ? records : records.concat(addedRecords)).map(r => r.rowid),
              ),
              onOk: async selectedRecords => {
                handleAddRelation(selectedRecords);
              },
              formData,
            });
          }}
          onBatchOperate={({ action }) => {
            let allowDeleteRowIds;
            switch (action) {
              case 'enterBatchEditing':
                cache.current.lastSelectRowIndex = undefined;
                updateTableState({
                  isBatchEditing: true,
                });
                break;
              case 'exitBatchEditing':
                updateTableState({
                  isBatchEditing: false,
                  selectedRowIds: [],
                });
                break;
              case 'removeRelation':
                // 批量取消关联
                handleRemoveRelation(selectedRowIds);
                break;
              case 'deleteRecords':
                allowDeleteRowIds = selectedRowIds.filter(rowId => {
                  const selectedRow = find(records, { rowid: rowId });
                  return selectedRow && selectedRow.allowdelete;
                });
                if (!allowDeleteRowIds.length) {
                  alert(_l('没有有权限删除的记录'), 3);
                  return;
                }
                if (allowRemoveRelation) {
                  Dialog.confirm({
                    onlyClose: true,
                    title: (
                      <span className="Bold" style={{ color: '#f44336' }}>
                        {_l('注意：此操作将删除原始记录')}
                      </span>
                    ),
                    description: _l('如果只需要取消与当前记录的关联关系，仍保留原始记录。可以选择仅取消关联关系'),
                    buttonType: 'danger',
                    cancelType: 'ghostgray',
                    okText: _l('删除记录'),
                    cancelText: _l('仅取消关联关系'),
                    onOk: () => {
                      deleteOriginalRecords({
                        recordIds: allowDeleteRowIds,
                      });
                    },
                    onCancel: () => handleRemoveRelation(selectedRowIds),
                  });
                } else {
                  Dialog.confirm({
                    title: _l('是否删除此条记录'),
                    buttonType: 'danger',
                    onOk: () => {
                      deleteOriginalRecords({
                        recordIds: allowDeleteRowIds,
                      });
                    },
                  });
                }
                break;
              case 'exportRecords':
                exportRelateRecordRecords({
                  appId: relateWorksheetInfo.appId,
                  worksheetId: relateWorksheetInfo.worksheetId,
                  downLoadUrl: relateWorksheetInfo.downLoadUrl,
                  viewId: control.viewId,
                  projectId: relateWorksheetInfo.projectId,
                  exportControlsId: control.showControls,
                  rowIds: selectedRowIds,
                });
                break;
            }
          }}
        />
      )}
      <div className="flex"></div>
      <div className={cx('operateButtons flexRow alignItemsCenter', { isInForm: base.isInForm && mode !== 'dialog' })}>
        {!!recordId && <AnimatedInput className="mRight6" keywords={keywords} control={control} onSearch={search} />}
        {from !== RECORD_INFO_FROM.DRAFT &&
          allowExportFromSetting &&
          !!recordId &&
          !get(window, 'shareState.shareId') && (
            <ExportSheetButton
              className="mRight6"
              style={{
                height: 28,
              }}
              exportSheet={cb => {
                if (!records.length) {
                  cb();
                  alert(_l('数据为空，暂不支持导出！'), 3);
                  return;
                }
                return exportRelateRecordRecords({
                  worksheetId,
                  rowId: recordId,
                  controlId: control.controlId,
                  filterControls: control.type === 51 ? filterControls : [],
                  fileName:
                    `${recordTitle ? recordTitle + '_' : ''}${control.controlName}_${moment().format(
                      'YYYYMMDDHHmmss',
                    )}`.trim() + '.xlsx',
                  onDownload: cb,
                });
              }}
            />
          )}
        {!isBatchEditing &&
          from !== 21 &&
          !!recordId &&
          (base.isTab || _.isEqual(changes, initialChanges) || _.isEmpty(changes)) && (
            <span
              className="mRight6"
              data-tip={_l('刷新')}
              style={{ height: 28 }}
              onClick={() => {
                refresh();
              }}
            >
              <IconBtn className="Hand ThemeHoverColor3">
                <i className="icon icon-task-later" />
              </IconBtn>
            </span>
          )}
        {mode === 'recordForm' && !!recordId && from !== RECORD_INFO_FROM.DRAFT && (
          <span
            data-tip={_l('全屏')}
            style={{ height: 28, marginRight: 6 }}
            onClick={() =>
              openRelateRelateRecordTable({
                appId,
                viewId,
                worksheetId,
                recordId,
                control: { ...control, ...(base.isTab ? { store: undefined } : {}) },
                allowEdit,
                formdata: formData,
                reloadTable: base.isTab ? refresh : () => {},
                updateWorksheetControls: updatedControls => {
                  updateBase({ control: updatedControls[0] });
                  updateWorksheetControls(updatedControls);
                },
              })
            }
          >
            <IconBtn className="Hand ThemeHoverColor3">
              <i className="icon icon-worksheet_enlarge" />
            </IconBtn>
          </span>
        )}

        {(!!recordId || control.type === 51) && (
          <Pagination
            allowChangePageSize={base.isTab}
            disabled={tableLoading}
            className="pagination"
            pageIndex={pageIndex}
            pageSize={pageSize}
            allCount={
              control.type === 51 && !isUndefined(searchMaxCount) && count > searchMaxCount ? searchMaxCount : count
            }
            countForShow={countForShow}
            changePageIndex={value => {
              updatePageIndex(value);
            }}
            changePageSize={value => {
              updatePageSize(value);
              localStorage.setItem('relateRecordTablePageSize', value);
            }}
            onPrev={() => {
              updatePageIndex(pageIndex - 1 < 0 ? 0 : pageIndex - 1);
            }}
            onNext={() => {
              updatePageIndex(
                pageIndex + 1 > Math.ceil(count / pageSize) ? Math.ceil(count / pageSize) : pageIndex + 1,
              );
            }}
          />
        )}
      </div>
    </Con>
  );
}

Operate.propTypes = {
  mode: string,
  cache: shape({}),
  smallMode: bool,
  style: shape({}),
  className: string,
  base: shape({}),
  tableState: shape({}),
  records: arrayOf(shape({})),
  appendRecords: func,
  handleAddRelation: func,
  handleRemoveRelation: func,
  updatePageIndex: func,
  refresh: func,
  search: func,
  updateTableState: func,
  handleOpenRecordInfo: func,
  updateWorksheetControls: func,
  deleteOriginalRecords: func,
};

export default connect(
  state => ({ ...state }),
  dispatch => ({
    appendRecords: bindActionCreators(actions.appendRecords, dispatch),
    updatePageIndex: bindActionCreators(actions.updatePageIndex, dispatch),
    updatePageSize: bindActionCreators(actions.updatePageSize, dispatch),
    refresh: bindActionCreators(actions.refresh, dispatch),
    updateBase: bindActionCreators(actions.updateBase, dispatch),
    search: bindActionCreators(actions.search, dispatch),
    handleAddRelation: bindActionCreators(actions.handleAddRelation, dispatch),
    handleRemoveRelation: bindActionCreators(actions.handleRemoveRelation, dispatch),
    updateTableState: bindActionCreators(actions.updateTableState, dispatch),
    deleteOriginalRecords: bindActionCreators(actions.deleteOriginalRecords, dispatch),
  }),
)(Operate);
