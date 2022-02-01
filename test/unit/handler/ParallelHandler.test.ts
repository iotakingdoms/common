import { Logger } from '../../../lib/logger/Logger';
import { Handler } from '../../../lib/handler/Handler';
import { ParallelHandler } from '../../../lib/handler/ParallelHandler';
import { mockLogger } from '../mocks/logger/Logger';
import { mockHandler } from '../mocks/handler/Handler';

describe('ParallelHandler', () => {
  let logger: jest.Mocked<Logger>;
  let nestedHandler1: jest.Mocked<Handler<string, void>>;
  let nestedHandler2: jest.Mocked<Handler<string, void>>;
  let nestedHandler3: jest.Mocked<Handler<string, void>>;
  let parallelHandler: ParallelHandler<string>;

  beforeAll(() => {
    logger = mockLogger();
    nestedHandler1 = mockHandler();
    nestedHandler2 = mockHandler();
    nestedHandler3 = mockHandler();

    parallelHandler = new ParallelHandler<string>({
      logger,
      handlers: [
        nestedHandler1,
        nestedHandler2,
        nestedHandler3,
      ],
    });
  });

  beforeEach(async () => {
    expect(nestedHandler1.initialize).not.toHaveBeenCalled();
    expect(nestedHandler2.initialize).not.toHaveBeenCalled();
    expect(nestedHandler3.initialize).not.toHaveBeenCalled();
    await parallelHandler.initialize();
    expect(nestedHandler1.initialize).toHaveBeenCalled();
    expect(nestedHandler2.initialize).toHaveBeenCalled();
    expect(nestedHandler3.initialize).toHaveBeenCalled();
  });

  afterEach(async () => {
    expect(nestedHandler1.terminate).not.toHaveBeenCalled();
    expect(nestedHandler2.terminate).not.toHaveBeenCalled();
    expect(nestedHandler3.terminate).not.toHaveBeenCalled();
    await parallelHandler.terminate();
    expect(nestedHandler1.terminate).toHaveBeenCalled();
    expect(nestedHandler2.terminate).toHaveBeenCalled();
    expect(nestedHandler3.terminate).toHaveBeenCalled();
  });

  describe('typical life cycle', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('executed canHandle on all nested handlers', () => {
      expect(nestedHandler1.canHandle).not.toHaveBeenCalled();
      expect(nestedHandler2.canHandle).not.toHaveBeenCalled();
      expect(nestedHandler3.canHandle).not.toHaveBeenCalled();
      parallelHandler.canHandle('something');
      expect(nestedHandler1.canHandle).toHaveBeenCalled();
      expect(nestedHandler2.canHandle).toHaveBeenCalled();
      expect(nestedHandler3.canHandle).toHaveBeenCalled();
    });

    it('executes nested handlers in parallel', async () => {
      const returnOrder: string[] = [];
      nestedHandler1.handle.mockImplementationOnce(async (): Promise<void> => {
        await new Promise((resolve) => { setTimeout(resolve, 30); });
        returnOrder.push('handled1');
      });

      nestedHandler2.handle.mockImplementationOnce(async (): Promise<void> => {
        await new Promise((resolve) => { setTimeout(resolve, 10); });
        returnOrder.push('handled2');
      });

      nestedHandler3.handle.mockImplementationOnce(async (): Promise<void> => {
        await new Promise((resolve) => { setTimeout(resolve, 20); });
        returnOrder.push('handled3');
      });

      expect(nestedHandler1.handle).not.toHaveBeenCalled();
      expect(nestedHandler2.handle).not.toHaveBeenCalled();
      expect(nestedHandler3.handle).not.toHaveBeenCalled();

      await parallelHandler.handle('something');

      expect(returnOrder[0]).toBe('handled2');
      expect(returnOrder[1]).toBe('handled3');
      expect(returnOrder[2]).toBe('handled1');

      expect(nestedHandler1.handle).toHaveBeenCalledWith('something');
      expect(nestedHandler2.handle).toHaveBeenCalledWith('something');
      expect(nestedHandler3.handle).toHaveBeenCalledWith('something');
    });

    it('does not invoke handle for nestedHandler that can not handle the input', async () => {
      nestedHandler2.canHandle.mockImplementationOnce((): boolean => false);
      expect(nestedHandler1.handle).not.toHaveBeenCalled();
      expect(nestedHandler2.handle).not.toHaveBeenCalled();
      expect(nestedHandler3.handle).not.toHaveBeenCalled();

      await parallelHandler.handle('something');

      expect(nestedHandler1.handle).toHaveBeenCalledWith('something');
      expect(nestedHandler2.handle).not.toHaveBeenCalled();
      expect(nestedHandler3.handle).toHaveBeenCalledWith('something');
    });
  });
});
