import { Initializable } from '../../../lib/Initializable';

export const mockInitializable = (): jest.Mocked<Initializable> => ({
  initialize: jest.fn(),
  terminate: jest.fn(),
});
