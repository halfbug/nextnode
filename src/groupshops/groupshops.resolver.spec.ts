import { Test, TestingModule } from '@nestjs/testing';
import { GroupshopsResolver } from './groupshops.resolver';
import { GroupshopsService } from './groupshops.service';

describe('GroupshopsResolver', () => {
  let resolver: GroupshopsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupshopsResolver, GroupshopsService],
    }).compile();

    resolver = module.get<GroupshopsResolver>(GroupshopsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
