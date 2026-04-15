const mongoose = require('mongoose');
const User = require('./models/User');
const LabProject = require('./models/LabProject');
const Quotation = require('./models/Quotation');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/university-lab-procurement';
mongoose.connect(mongoUri);

async function populateData() {
	try {
		// Get user IDs by email
		const university = await User.findOne({ email: 'seu1@gmail.com' });
		const vendor1 = await User.findOne({ email: 'star@gmail.com' });
		const vendor2 = await User.findOne({ email: 'techlandbd@gmail.com' });

		if (!university) {
			console.error('❌ University seu1@gmail.com not found');
			process.exit(1);
		}
		if (!vendor1) {
			console.error('❌ Vendor star@gmail.com not found');
			process.exit(1);
		}
		if (!vendor2) {
			console.error('❌ Vendor techlandbd@gmail.com not found');
			process.exit(1);
		}

		console.log('✅ Found users:');
		console.log(`   University: ${university.name} (${university.email})`);
		console.log(`   Vendor 1: ${vendor1.name} (${vendor1.email})`);
		console.log(`   Vendor 2: ${vendor2.name} (${vendor2.email})`);

		// Create lab projects
		const labs = await LabProject.insertMany([
			{
				universityId: university._id,
				labName: 'AI and Machine Learning Lab',
				labType: 'AI',
				requirements: {
					mainRequirement: 'High-performance computing systems for ML training',
					systems: 10,
					budgetMin: 500000,
					budgetMax: 1000000,
					performancePriority: 'GPU Performance',
					software: ['CUDA', 'TensorFlow', 'PyTorch', 'Anaconda'],
					timeline: new Date('2026-06-30')
				},
				status: 'bidding'
			},
			{
				universityId: university._id,
				labName: 'Computer Graphics Lab',
				labType: 'Graphics',
				requirements: {
					mainRequirement: 'Graphics rendering and visualization systems',
					systems: 8,
					budgetMin: 400000,
					budgetMax: 800000,
					performancePriority: 'GPU Memory',
					software: ['Blender', 'Unreal Engine', 'OpenGL', 'DirectX'],
					timeline: new Date('2026-07-15')
				},
				status: 'bidding'
			},
			{
				universityId: university._id,
				labName: 'Networking Lab',
				labType: 'Networking',
				requirements: {
					mainRequirement: 'Network infrastructure and security testing',
					systems: 6,
					budgetMin: 300000,
					budgetMax: 600000,
					performancePriority: 'Network Speed',
					software: ['Cisco Packet Tracer', 'Wireshark', 'GNS3'],
					timeline: new Date('2026-08-01')
				},
				status: 'bidding'
			}
		]);

		console.log(`\n✅ Created ${labs.length} lab projects`);

		// Create quotations from vendor 1
		const quotations1 = await Quotation.insertMany([
			{
				labProjectId: labs[0]._id,
				vendorId: vendor1._id,
				components: [
					{
						category: 'CPU',
						name: 'Intel Xeon Platinum 8380',
						unitPrice: 15000,
						quantity: 10,
						warranty: '3 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'GPU',
						name: 'NVIDIA A100 80GB',
						unitPrice: 50000,
						quantity: 10,
						warranty: '3 years',
						deliveryTime: '3 weeks'
					},
					{
						category: 'RAM',
						name: 'DDR4 64GB ECC',
						unitPrice: 8000,
						quantity: 10,
						warranty: '5 years',
						deliveryTime: '1 week'
					},
					{
						category: 'Storage',
						name: 'NVMe SSD 2TB',
						unitPrice: 25000,
						quantity: 10,
						warranty: '5 years',
						deliveryTime: '1 week'
					}
				],
				totalPrice: 950000,
				bulkDiscount: 50000,
				installationIncluded: true,
				maintenanceIncluded: true,
				status: 'pending'
			},
			{
				labProjectId: labs[1]._id,
				vendorId: vendor1._id,
				components: [
					{
						category: 'CPU',
						name: 'Intel Core i9-13900K',
						unitPrice: 10000,
						quantity: 8,
						warranty: '3 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'GPU',
						name: 'NVIDIA RTX 4090',
						unitPrice: 40000,
						quantity: 8,
						warranty: '3 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'RAM',
						name: 'DDR5 64GB',
						unitPrice: 12000,
						quantity: 8,
						warranty: '5 years',
						deliveryTime: '1 week'
					}
				],
				totalPrice: 560000,
				bulkDiscount: 20000,
				installationIncluded: true,
				maintenanceIncluded: false,
				status: 'pending'
			},
			{
				labProjectId: labs[2]._id,
				vendorId: vendor1._id,
				components: [
					{
						category: 'Networking',
						name: 'Cisco Catalyst 9300 Switch',
						unitPrice: 80000,
						quantity: 2,
						warranty: '5 years',
						deliveryTime: '1 week'
					},
					{
						category: 'Networking',
						name: 'Cisco Router ASR 1000',
						unitPrice: 120000,
						quantity: 1,
						warranty: '5 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'CPU',
						name: 'Intel Xeon E-2388G',
						unitPrice: 12000,
						quantity: 6,
						warranty: '3 years',
						deliveryTime: '1 week'
					}
				],
				totalPrice: 410000,
				bulkDiscount: 10000,
				installationIncluded: true,
				maintenanceIncluded: true,
				status: 'pending'
			}
		]);

		console.log(`✅ Created ${quotations1.length} quotations from vendor 1 (${vendor1.email})`);

		// Create quotations from vendor 2
		const quotations2 = await Quotation.insertMany([
			{
				labProjectId: labs[0]._id,
				vendorId: vendor2._id,
				components: [
					{
						category: 'CPU',
						name: 'AMD EPYC 7003 Series',
						unitPrice: 14000,
						quantity: 10,
						warranty: '3 years',
						deliveryTime: '3 weeks'
					},
					{
						category: 'GPU',
						name: 'NVIDIA H100 80GB',
						unitPrice: 55000,
						quantity: 10,
						warranty: '3 years',
						deliveryTime: '4 weeks'
					},
					{
						category: 'RAM',
						name: 'DDR4 64GB ECC',
						unitPrice: 7500,
						quantity: 10,
						warranty: '5 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'Storage',
						name: 'NVMe SSD 2TB Enterprise',
						unitPrice: 23000,
						quantity: 10,
						warranty: '5 years',
						deliveryTime: '2 weeks'
					}
				],
				totalPrice: 920000,
				bulkDiscount: 40000,
				installationIncluded: true,
				maintenanceIncluded: true,
				status: 'pending'
			},
			{
				labProjectId: labs[1]._id,
				vendorId: vendor2._id,
				components: [
					{
						category: 'CPU',
						name: 'AMD Ryzen 9 7950X',
						unitPrice: 9500,
						quantity: 8,
						warranty: '3 years',
						deliveryTime: '3 weeks'
					},
					{
						category: 'GPU',
						name: 'NVIDIA RTX 6000 Ada',
						unitPrice: 35000,
						quantity: 8,
						warranty: '3 years',
						deliveryTime: '3 weeks'
					},
					{
						category: 'RAM',
						name: 'DDR5 64GB Gaming',
						unitPrice: 11000,
						quantity: 8,
						warranty: '5 years',
						deliveryTime: '2 weeks'
					}
				],
				totalPrice: 520000,
				bulkDiscount: 15000,
				installationIncluded: false,
				maintenanceIncluded: false,
				status: 'pending'
			},
			{
				labProjectId: labs[2]._id,
				vendorId: vendor2._id,
				components: [
					{
						category: 'Networking',
						name: 'Juniper EX4400 Switch',
						unitPrice: 75000,
						quantity: 2,
						warranty: '5 years',
						deliveryTime: '2 weeks'
					},
					{
						category: 'Networking',
						name: 'Juniper MX960 Router',
						unitPrice: 110000,
						quantity: 1,
						warranty: '5 years',
						deliveryTime: '3 weeks'
					},
					{
						category: 'CPU',
						name: 'Intel Xeon E-2388G',
						unitPrice: 11500,
						quantity: 6,
						warranty: '3 years',
						deliveryTime: '2 weeks'
					}
				],
				totalPrice: 390000,
				bulkDiscount: 5000,
				installationIncluded: false,
				maintenanceIncluded: true,
				status: 'pending'
			}
		]);

		console.log(`✅ Created ${quotations2.length} quotations from vendor 2 (${vendor2.email})`);

		console.log('\n📊 Summary:');
		console.log(`   Lab Projects: ${labs.length}`);
		console.log(`   Total Quotations: ${quotations1.length + quotations2.length}`);
		console.log(`   - From ${vendor1.email}: ${quotations1.length}`);
		console.log(`   - From ${vendor2.email}: ${quotations2.length}`);

		console.log('\n✅ Database populated successfully!');
		mongoose.disconnect();
	} catch (error) {
		console.error('❌ Error populating data:', error.message);
		mongoose.disconnect();
		process.exit(1);
	}
}

populateData();
