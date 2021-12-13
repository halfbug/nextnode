import { Test, TestingModule } from '@nestjs/testing';
import { GroupshopsService } from './Groupshops.service';

describe('GroupshopsService', () => {
  let service: GroupshopsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupshopsService],
    }).compile();

    service = module.get<GroupshopsService>(GroupshopsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
