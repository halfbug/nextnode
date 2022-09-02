import { Test, TestingModule } from '@nestjs/testing';
import { RetentiontoolsService } from './retentiontools.service';

describe('RetentiontoolsService', () => {
  let service: RetentiontoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetentiontoolsService],
    }).compile();

    service = module.get<RetentiontoolsService>(RetentiontoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
