import { Injectable } from '@nestjs/common';
import { Repository, getMongoManager } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateAdminActivityLogInput,
  fieldDetails,
} from './dto/create-admin-activity-log.input';
import { UpdateAdminActivityLogInput } from './dto/update-admin-activity-log.input';
import AdminActivityLogs from './entities/admin-activity-log.model';
import { validateOrReject } from 'class-validator';
import { StoresService } from 'src/stores/stores.service';
import { DropsCategoryService } from 'src/drops-category/drops-category.service';

@Injectable()
export class AdminActivityLogsService {
  constructor(
    @InjectRepository(AdminActivityLogs)
    private adminActivityLogsRepository: Repository<AdminActivityLogs>,
    private readonly storesService: StoresService,
    private readonly dropsCategoryService: DropsCategoryService,
  ) {}
  async create(createAdminActivityLogInput: CreateAdminActivityLogInput) {
    // console.log(
    //   '🚀 ~ file: admin-activity-logs.service.ts:18 ~ AdminActivityLogsService ~ create ~ createAdminActivityLogInput',
    //   createAdminActivityLogInput,
    // );
    try {
      const adminActivity = this.adminActivityLogsRepository.create(
        createAdminActivityLogInput,
      );
      adminActivity.changes = [new fieldDetails()];
      adminActivity.id = uuid();
      adminActivity.changes = createAdminActivityLogInput.changes;
      return this.adminActivityLogsRepository.save(adminActivity);
    } catch (errors) {
      console.log(
        'Caught promise rejection (validation failed). Errors: ',
        errors,
      );
      return errors;
    }
  }

  findAll() {
    return this.adminActivityLogsRepository.find();
  }

  async dropsActivity(route: string, storeId: string) {
    const agg = [
      {
        $match: {
          route: route,
          storeId: storeId,
        },
      },
      {
        $lookup: {
          from: 'admin_user',
          localField: 'userId',
          foreignField: 'id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
    ];
    const manager = getMongoManager();
    const gs = await manager.aggregate(AdminActivityLogs, agg).toArray();
    return gs;
  }
  async compareDropsArrays(oldValue: any, newValue: any) {
    const activityLog = [];
    Object.keys(newValue)?.map((key) => {
      if (key !== 'userId' && key !== 'activity') {
        if (
          newValue[key] !== oldValue[key] &&
          typeof newValue[key] !== 'object'
        ) {
          activityLog.push({
            fieldname: key,
            oldvalue: oldValue[key],
            newValue: newValue[key],
          });
        }
        if (typeof newValue[key] === 'object') {
          this.innerDropsArrays(
            newValue[key],
            oldValue[key],
            activityLog,
            oldValue[0]?.title,
          );
        }
      }
    });
    return activityLog;
  }

  innerDropsArrays(newObject: any, oldValue: any, activityLog: any, title) {
    Object.keys(newObject)?.map((ikey) => {
      if (newObject[ikey] !== null) {
        if (
          newObject[ikey] !== oldValue[ikey] &&
          typeof newObject[ikey] !== 'object'
        ) {
          activityLog.push({
            parentTitle: title,
            fieldname: ikey,
            oldvalue: oldValue[ikey],
            newValue: newObject[ikey],
          });
        }
        if (typeof newObject[ikey] === 'object') {
          this.innerDropsArrays(
            newObject[ikey],
            oldValue[ikey],
            activityLog,
            title,
          );
        }
      }
    });
    return activityLog;
  }

  async compareVideoArrays(oldValue: any, newValues: any) {
    const activityLog = [];
    oldValue.forEach((field, key) => {
      const result = newValues.find((item) => item.id == field._id);
      if (typeof result !== 'undefined') {
        if (field.orderId != result.orderId) {
          activityLog.push({
            parentTitle: field.name,
            fieldname: 'sortOrder',
            oldvalue: field.orderId,
            newValue: result.orderId,
          });
        }
        if (field.status !== result.status) {
          activityLog.push({
            parentTitle: field.name,
            fieldname: 'status',
            oldvalue: field.status,
            newValue: result.status,
          });
        }
      } else {
        if (field.status !== 'InActive') {
          activityLog.push({
            parentTitle: field.name,
            fieldname: 'status',
            oldvalue: field.status,
            newValue: 'InActive',
          });
        }
        if (field.orderId != 0) {
          activityLog.push({
            parentTitle: field.name,
            fieldname: 'sortOrder',
            oldvalue: field.orderId,
            newValue: 0,
          });
        }
      }
    });
    return activityLog;
  }

  async compareDiscoveryArrays(oldValue: any, newValues: any) {
    const activityLog = [];
    oldValue?.matchingBrandName.forEach((field, key) => {
      const result = newValues.matchingBrandName.find(
        (item) => item.id == field.id,
      );
      if (typeof result === 'undefined') {
        activityLog.push({
          id: field.id,
          brandName: field.brandName,
        });
      }
    });
    return activityLog;
  }

  async removeCompareArrays(oldValue: any, newValue: any, context: string) {
    let activityLog = [];
    if (
      context === 'Drops Navigation Management' ||
      context === 'Manage Section Content'
    ) {
      Object.keys(oldValue)?.map((key) => {
        if (key !== 'userId' && key !== 'activity' && key !== '_id') {
          activityLog.push(oldValue[key]);
          if (typeof oldValue[key] === 'object') {
            activityLog = this.innerRemoveCompareArrays(
              oldValue[key],
              newValue[key],
              activityLog,
            );
          }
        }
      });
    } else {
      const difference = oldValue.filter(
        (e) => !newValue.find((a) => e.id === a.id),
      );
      activityLog = difference;
    }
    return activityLog;
  }

  innerRemoveCompareArrays(oldValue: any, newValue: any, activityLog: any) {
    Object.keys(oldValue)?.map((ikey) => {
      if (oldValue[ikey] !== null) {
        if (
          typeof oldValue[ikey] === 'object' &&
          ikey !== 'createdAt' &&
          ikey !== 'updatedAt' &&
          ikey !== '_id'
        ) {
          const difference = oldValue[ikey].filter(
            (e) => !newValue[ikey].find((a) => e.name === a.name),
          );
          activityLog[0][ikey] = difference;
        }
      }
    });
    return activityLog;
  }

  async compareSortingArrays(oldValue: any, newValue: any) {
    const activityLog = [];
    oldValue.forEach((field, key) => {
      const result = newValue.find((item) => item.title === field.title);
      if (typeof result !== 'undefined') {
        if (field.sortOrder !== result.sortOrder) {
          activityLog.push({
            parentTitle: field.title,
            fieldname: 'sortOrder',
            oldvalue: field.sortOrder,
            newValue: result.sortOrder,
          });
        }
      }
    });
    return activityLog;
  }

  async createAdminActivity(
    message,
    context,
    operation,
    mfields,
    userId,
    oldValue,
    storeId,
  ) {
    let compareResult;
    if (operation === 'UPDATE') {
      if (context === 'Update Sorting Order') {
        compareResult = await this.compareSortingArrays(oldValue, mfields);
      } else if (context === 'Video Management') {
        compareResult = await this.compareVideoArrays(oldValue, mfields);
      } else {
        compareResult = await this.compareDropsArrays(oldValue, mfields);
      }
    } else if (operation === 'REMOVE') {
      if (
        context == 'Manage Section Content' ||
        context === 'Cart Rewards Management'
      ) {
        compareResult = await this.removeCompareArrays(
          oldValue,
          mfields,
          context,
        );
      } else if (context === 'Discovery Tools Management') {
        compareResult = await this.compareDiscoveryArrays(oldValue, mfields);
      } else {
        compareResult = oldValue;
      }
    } else {
      compareResult = mfields;
    }
    const result = {
      route: message,
      userId: userId,
      storeId: storeId,
      context: mfields?.activity ?? context,
      operation: operation,
      changes: compareResult,
    };
    console.log('compareResult', compareResult);
    if (compareResult?.length > 0 || typeof compareResult === 'object') {
      this.create(result);
    }
  }

  findOne(id: string) {
    return this.adminActivityLogsRepository.findOne({ id });
  }

  async update(id: string, updateAdminRoleInput: UpdateAdminActivityLogInput) {
    await this.adminActivityLogsRepository.update({ id }, updateAdminRoleInput);
    const adminUser = await this.adminActivityLogsRepository.findOne({
      where: {
        id,
      },
    });
    return adminUser;
  }

  remove(id: string) {
    return this.adminActivityLogsRepository.delete({ id });
  }
}