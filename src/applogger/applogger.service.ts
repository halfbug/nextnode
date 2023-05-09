import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository, getMongoManager } from 'typeorm';
import { CreateAppLoggerInput } from './dto/create-applogger.input';
import { UpdateAppLoggerInput } from './dto/update-applogger.input';
import { AppLogger } from './entities/applogger.entity';
import { v4 as uuid } from 'uuid';
import { FilterOption } from 'src/drops-groupshop/dto/paginationArgs.input';
import { PaginationService } from 'src/utils/pagination.service';

@Injectable()
export class AppLoggerService {
  constructor(
    @InjectRepository(AppLogger)
    private errorLogRepository: Repository<AppLogger>,
    private paginateService: PaginationService,
  ) {}

  async create(createAppLoggerInput: CreateAppLoggerInput) {
    const errlog = this.errorLogRepository.create(createAppLoggerInput);
    const id = uuid();
    return await this.errorLogRepository.save({ id, ...errlog });
  }

  findAll() {
    console.log(
      new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    );
    return this.errorLogRepository.find({
      where: {
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });
  }

  async getLogs({ pagination, filters, sorting }) {
    try {
      const { skip, take } = pagination;

      let criteria = {};
      let agg: any[] = [
        {
          $skip: skip,
        },
        {
          $limit: take,
        },
      ];
      const dateField = {
        $addFields: {
          strDate: {
            $dateToString: {
              format: '%m/%d/%Y',
              date: '$createdAt',
            },
          },
        },
      };

      if (sorting.length) {
        agg = [
          {
            $sort: {
              [sorting[0].field]: sorting[0].sort === 'asc' ? 1 : -1,
            },
          },
          ...agg,
        ];
      } else {
        agg = [
          {
            $sort: {
              createdAt: -1,
            },
          },
          ...agg,
        ];
      }
      if (filters.length) {
        if (filters[0].columnField === 'createdAt') {
          filters[0].columnField = 'strDate';
        }
        switch (filters[0].operatorValue) {
          case FilterOption.CONTAINS:
            criteria = {
              $regex: `(?i)${filters[0].value}`,
            };
            break;
          case FilterOption.STARTS_WITH:
            criteria = {
              $regex: `^(?i)${filters[0].value}`,
            };
            break;
          case FilterOption.ENDS_WITH:
            criteria = {
              $regex: `${filters[0].value}$`,
            };
            break;
          case FilterOption.EQUALS:
            criteria = {
              $regex: `^${filters[0].value}$`,
            };
            break;
          case FilterOption.IS_EMPTY:
            criteria = {
              $eq: '',
            };
            break;
          case FilterOption.IS_NOT_EMPTY:
            criteria = {
              $ne: '',
            };
            break;
          case FilterOption.IS_ANY_OF:
            criteria = { $in: filters[0].value };
            break;
          default:
            break;
        }
        agg = [
          dateField,
          {
            $match: {
              [filters[0].columnField]: criteria,
            },
          },
          ...agg,
        ];
      }

      const manager = getMongoManager();
      const gs = await manager.aggregate(AppLogger, agg).toArray();
      const result = gs;
      agg.pop();
      agg.pop();
      agg.push({
        $count: 'total',
      });
      const gscount = await manager.aggregate(AppLogger, agg).toArray();
      const total = gscount[0]?.total;
      return {
        result,
        pageInfo: this.paginateService.paginate(result, total, take, skip),
      };
    } catch (err) {
      console.log(err);
    }
  }

  findOne(id: string) {
    return this.errorLogRepository.findOne({ id });
  }

  async findLatestLog(context: string, storeId: string) {
    const agg = [
      {
        $match: {
          context,
          message: RegExp(storeId, 'i'),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 1,
      },
    ];
    const manager = getMongoManager();
    const res = await manager.aggregate(AppLogger, agg).toArray();
    return res[0];
  }

  update(id: string, updateAppLoggerInput: UpdateAppLoggerInput) {
    return `This action updates a #${id} applogger`;
  }

  remove(id: string) {
    return `This action removes a #${id} applogger`;
  }
}
