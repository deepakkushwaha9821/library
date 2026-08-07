const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Book = require('../models/Book');

const seedDemoData = async () => {
  try {
    const ebooksDir = path.join(__dirname, '../uploads/ebooks');
    if (!fs.existsSync(ebooksDir)) {
      fs.mkdirSync(ebooksDir, { recursive: true });
    }

    await Book.destroy({ where: {} });

    console.log('Seeding SQLite database with the 8 real PDF books...');

    let seller = await User.findOne({ where: { email: 'seller@readpulse.com' } });
    if (!seller) {
      seller = await User.create({
        name: 'Elena Rostova',
        email: 'seller@readpulse.com',
        password: 'password123',
        role: 'seller',
        isSellerApproved: true
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@readpulse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isSellerApproved: true
      });
    } else {
      admin.password = adminPassword;
      admin.name = adminName;
      await admin.save();
    }

    let buyer = await User.findOne({ where: { email: 'buyer@readpulse.com' } });
    if (!buyer) {
      buyer = await User.create({
        name: 'Alex Morgan',
        email: 'buyer@readpulse.com',
        password: 'password123',
        role: 'buyer'
      });
    }

    const realBooksOnly = [
      {
        title: "Alice's Adventures in Wonderland",
        authorName: 'Lewis Carroll',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/alices-adventures-in-wonderland.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
        price: 9.99,
        rentPrice: 2.49,
        isIncludedInSubscription: true,
        category: 'Fantasy',
        description: 'The beloved classic fantasy novel about a young girl named Alice who falls through a rabbit hole into a subterranean fantasy world.',
        sampleEbookText: 'CHAPTER I. Down the Rabbit-Hole. Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do...',
        status: 'approved',
        salesCount: 150,
        rentCount: 85,
        averageRating: 4.9,
        reviewsCount: 42
      },
      {
        title: 'Frankenstein',
        authorName: 'Mary Shelley',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/frankenstein.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600',
        price: 11.99,
        rentPrice: 2.99,
        isIncludedInSubscription: true,
        category: 'Sci-Fi',
        description: 'The iconic gothic science fiction masterpiece depicting Victor Frankenstein\'s creation of a sentient monster in his laboratory.',
        sampleEbookText: 'Letter 1. To Mrs. Saville, England. St. Petersburgh, Dec. 11th, 17--. You will rejoice to hear that no disaster has accompanied the commencement of an enterprise...',
        status: 'approved',
        salesCount: 210,
        rentCount: 110,
        averageRating: 4.8,
        reviewsCount: 64
      },
      {
        title: 'Little Women',
        authorName: 'Louisa May Alcott',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/little-women.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600',
        price: 12.99,
        rentPrice: 3.29,
        isIncludedInSubscription: true,
        category: 'Fiction',
        description: 'The timeless coming-of-age classic following the lives, loves, and struggles of four sisters—Meg, Jo, Beth, and Amy March.',
        sampleEbookText: 'CHAPTER ONE. PLAYING PILGRIMS. "Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug. "It\'s so dreadful to be poor!" sighed Meg...',
        status: 'approved',
        salesCount: 180,
        rentCount: 95,
        averageRating: 5.0,
        reviewsCount: 58
      },
      {
        title: 'Pride and Prejudice',
        authorName: 'Jane Austen',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/pride-and-prejudice.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
        price: 10.99,
        rentPrice: 2.99,
        isIncludedInSubscription: true,
        category: 'Fiction',
        description: 'The famous romantic novel of manners following the turbulent relationship between Elizabeth Bennet and Fitzwilliam Darcy.',
        sampleEbookText: 'CHAPTER I. It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife...',
        status: 'approved',
        salesCount: 320,
        rentCount: 140,
        averageRating: 5.0,
        reviewsCount: 92
      },
      {
        title: 'The Prince',
        authorName: 'Niccolò Machiavelli',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/the-prince.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600',
        price: 14.99,
        rentPrice: 3.99,
        isIncludedInSubscription: true,
        category: 'History',
        description: 'The groundbreaking 16th-century political treatise on leadership, statecraft, strategy, and power acquisition.',
        sampleEbookText: 'CHAPTER I. HOW MANY KINDS OF PRINCIPALITIES THERE ARE, AND BY WHAT MEANS THEY ARE ACQUIRED. All states, all powers, that have held and hold rule over men have been and are either republics or principalities...',
        status: 'approved',
        salesCount: 145,
        rentCount: 60,
        averageRating: 4.9,
        reviewsCount: 39
      },
      {
        title: 'The Time Machine',
        authorName: 'H.G. Wells',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/the-time-machine.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
        price: 8.99,
        rentPrice: 1.99,
        isIncludedInSubscription: true,
        category: 'Sci-Fi',
        description: 'The pioneer science fiction novella that popularized the concept of time travel using a vehicle to move selectively forward or backward.',
        sampleEbookText: 'CHAPTER 1. The Time Traveller (for so it will be convenient to call him) was expounding a recondite matter to us. His grey eyes shone and twinkled...',
        status: 'approved',
        salesCount: 195,
        rentCount: 90,
        averageRating: 4.8,
        reviewsCount: 47
      },
      {
        title: 'The War of the Worlds',
        authorName: 'H.G. Wells',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/the-war-of-the-worlds.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600',
        price: 9.99,
        rentPrice: 2.49,
        isIncludedInSubscription: true,
        category: 'Sci-Fi',
        description: 'The seminal alien invasion novel recounting humanity\'s desperate battle against Martian tripods equipped with heat-rays.',
        sampleEbookText: 'BOOK ONE: THE COMING OF THE MARTIANS. CHAPTER ONE: THE EVE OF THE WAR. No one would have believed in the last years of the nineteenth century that this world was being watched keenly and closely by intelligences greater than man\'s...',
        status: 'approved',
        salesCount: 230,
        rentCount: 105,
        averageRating: 4.9,
        reviewsCount: 68
      },
      {
        title: 'Treasure Island',
        authorName: 'Robert Louis Stevenson',
        sellerId: seller.id,
        format: 'ebook',
        fileUrl: '/uploads/ebooks/treasure-island.pdf',
        coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600',
        price: 10.99,
        rentPrice: 2.99,
        isIncludedInSubscription: true,
        category: 'Fiction',
        description: 'The classic pirate adventure novel featuring Jim Hawkins, Long John Silver, buried gold maps, and nautical peril.',
        sampleEbookText: 'PART ONE: THE OLD BUCCANEER. CHAPTER 1: The Old Sea-dog at the Admiral Benbow. Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island...',
        status: 'approved',
        salesCount: 260,
        rentCount: 130,
        averageRating: 5.0,
        reviewsCount: 74
      }
    ];

    await Book.bulkCreate(realBooksOnly);
    console.log('Successfully seeded SQLite with the 8 real PDF books!');
  } catch (error) {

    console.error('Error seeding demo data:', error);
  }
};

module.exports = seedDemoData;
