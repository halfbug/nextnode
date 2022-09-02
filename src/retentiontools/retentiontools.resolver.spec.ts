import { Test, TestingModule } from '@nestjs/testing';
import { RetentiontoolsResolver } from './retentiontools.resolver';
import { RetentiontoolsService } from './retentiontools.service';

describe('RetentiontoolsResolver', () => {
  let resolver: RetentiontoolsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetentiontoolsResolver, RetentiontoolsService],
    }).compile();

    resolver = module.get<RetentiontoolsResolver>(RetentiontoolsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
