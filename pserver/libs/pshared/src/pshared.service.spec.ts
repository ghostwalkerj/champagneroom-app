import { Test, TestingModule } from '@nestjs/testing';
import { PsharedService } from './pshared.service';

describe('PsharedService', () => {
  let service: PsharedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PsharedService],
    }).compile();

    service = module.get<PsharedService>(PsharedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
