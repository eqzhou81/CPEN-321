// Test setup file
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Mock mongoose to prevent actual database connections during tests
jest.mock('mongoose', () => {
  const mockObjectId = jest.fn().mockImplementation((id) => id || 'mockObjectId');
  
  const mockTypes = {
    ObjectId: mockObjectId,
    String: String,
    Number: Number,
    Date: Date,
    Boolean: Boolean,
    Array: Array,
    Mixed: {}
  };

  const mockSchema: any = {
    index: jest.fn(),
    pre: jest.fn(),
    post: jest.fn(),
    virtual: jest.fn().mockReturnValue({ get: jest.fn(), set: jest.fn() }),
    methods: {},
    statics: {},
    plugin: jest.fn(),
    add: jest.fn(),
    path: jest.fn(),
    paths: {},
    tree: {}
  };

  const SchemaConstructor: any = jest.fn().mockImplementation(() => mockSchema);
  SchemaConstructor.Types = mockTypes;

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1
    },
    Types: {
      ObjectId: mockObjectId
    },
    model: jest.fn(),
    Schema: SchemaConstructor
  };
});

// Increase timeout for async operations
jest.setTimeout(10000);