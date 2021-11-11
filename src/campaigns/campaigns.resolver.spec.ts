import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignsService } from './campaigns.service';

describe('CampaignsResolver', () => {
  let resolver: CampaignsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignsResolver, CampaignsService],
    }).compile();

    resolver = module.get<CampaignsResolver>(CampaignsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
