/**
 * Unit tests for the chat controller:
 * - private chats are created lazily and never duplicated per pair
 * - the all-chefs group channel creates only one conversation per buyer
 * - the chefs list returns only cook users
 */
import { jest } from '@jest/globals';

function makeReq(overrides = {}) {
  return {
    user: { _id: 'buyer1', role: 'buyer' },
    params: { cookId: 'cook1', ...overrides.params },
    res: { json: jest.fn(), status: jest.fn().mockReturnThis() },
  };
}

describe('chat controller', () => {
  let getOrCreatePrivateChat;
  let getAllChefsChannel;
  let getChefs;
  let mockConversation;
  let mockUser;

  beforeEach(async () => {
    jest.resetModules();

    mockConversation = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };
    mockUser = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    jest.unstable_mockModule('../models/ChatConversation.js', () => ({
      default: mockConversation,
    }));
    jest.unstable_mockModule('../models/Message.js', () => ({
      default: { find: jest.fn() },
    }));
    jest.unstable_mockModule('../models/User.js', () => ({
      default: mockUser,
    }));

    const chat = await import('../controllers/chatController.js');
    getOrCreatePrivateChat = chat.getOrCreatePrivateChat;
    getAllChefsChannel = chat.getAllChefsChannel;
    getChefs = chat.getChefs;
  });

  describe('POST /api/chat/private/:cookId', () => {
    beforeEach(() => {
      mockUser.findById.mockResolvedValue({
        _id: 'cook1',
        name: 'Cook One',
        role: 'cook',
        cookProfile: { isCook: true },
      });
    });

    it('returns the existing conversation when one already exists', async () => {
      mockConversation.findOne.mockResolvedValue({ _id: 'conv1', type: 'private' });
      const req = makeReq();
      await getOrCreatePrivateChat(req, req.res);

      expect(mockConversation.findOne).toHaveBeenCalledTimes(1);
      expect(mockConversation.create).not.toHaveBeenCalled();
      expect(req.res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ _id: 'conv1' }) }),
      );
    });

    it('creates a new private conversation when none exists', async () => {
      mockConversation.findOne.mockResolvedValue(null);
      mockConversation.create.mockResolvedValue({ _id: 'conv2', type: 'private' });
      const req = makeReq();
      await getOrCreatePrivateChat(req, req.res);

      expect(mockUser.findById).toHaveBeenCalledWith('cook1');
      expect(mockConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'private',
          participants: expect.arrayContaining(['buyer1', 'cook1']),
        }),
      );
      expect(req.res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ _id: 'conv2' }) }),
      );
    });

    it('refuses a private chat with oneself', async () => {
      const req = makeReq({ params: { cookId: 'buyer1' } });
      await getOrCreatePrivateChat(req, req.res);
      expect(req.res.status).toHaveBeenCalledWith(400);
    });

    it('refuses chatting with a non-cook', async () => {
      mockUser.findById.mockResolvedValue({
        _id: 'user2',
        role: 'buyer',
        cookProfile: {},
      });
      const req = makeReq({ params: { cookId: 'user2' } });
      await getOrCreatePrivateChat(req, req.res);
      expect(req.res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('POST /api/chat/all-chefs', () => {
    it('reuses the group conversation when it already exists', async () => {
      mockConversation.findOne.mockResolvedValue({ _id: 'group1', type: 'group' });
      const req = makeReq();
      await getAllChefsChannel(req, req.res);

      expect(mockConversation.create).not.toHaveBeenCalled();
      expect(req.res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ _id: 'group1' }) }),
      );
    });

    it('creates the group channel once', async () => {
      mockConversation.findOne.mockResolvedValue(null);
      mockConversation.create.mockResolvedValue({ _id: 'group2', type: 'group' });
      const req = makeReq();
      await getAllChefsChannel(req, req.res);

      expect(mockConversation.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'group', isAllChefsChannel: true }),
      );
      expect(mockConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'group',
          isAllChefsChannel: true,
        }),
      );
      expect(req.res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ _id: 'group2' }) }),
      );
    });
  });

  describe('GET /api/chat/chefs', () => {
    it('returns only cook users', async () => {
      const chefs = [{ _id: 'cook1', name: 'Cook One' }];
      mockUser.find.mockReturnValue({ select: jest.fn().mockResolvedValue(chefs) });
      const req = makeReq();
      await getChefs(req, req.res);

      expect(mockUser.find).toHaveBeenCalled();
      expect(req.res.json).toHaveBeenCalledWith(
        expect.objectContaining({ count: 1 }),
      );
    });
  });
});
