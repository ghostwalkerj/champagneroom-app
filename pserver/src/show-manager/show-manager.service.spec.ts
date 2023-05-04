import { Test, TestingModule } from '@nestjs/testing';
import { ShowManagerService } from './show-manager.service';

describe('ShowManagerService', () => {
  let service: ShowManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShowManagerService],
    }).compile();

    service = module.get<ShowManagerService>(ShowManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
