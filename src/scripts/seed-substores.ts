import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Substore } from '../models/Substore';

dotenv.config();

const substores = [
  { _id: '6707977fec74db0032682974', name: 'Testing', alias: 'testing' },
  { _id: '66506005147d6c73c1110115', name: 'Goa', alias: 'goa' },
  { _id: '66506004aa64743ceefbed25', name: 'Telangana', alias: 'telangana' },
  { _id: '66506004a7cddee1b8adb014', name: 'Pune BR', alias: 'pune-br' },
  { _id: '66506004145c16635e6cc914', name: 'Solapur BR', alias: 'solapur-br' },
  { _id: '66506002c8f2d6e221b91988', name: 'Nashik BR', alias: 'nashik-br' },
  { _id: '66506002aa64743ceefbecf1', name: 'Aurangabad BR', alias: 'aurangabad-br' },
  { _id: '66506002998183e1b1935f41', name: 'Chhattisgarh', alias: 'chhattisgarh' },
  { _id: '66506000c8f2d6e221b9193a', name: 'Mumbai BR', alias: 'mumbai-br' },
  { _id: '6650600062e3d963520d0bc3', name: 'Dadra & Nagar Haveli', alias: 'dadra-and-nagar-haveli' },
  { _id: '6650600024e61363e088c526', name: 'West Bengal', alias: 'west-bengal' },
  { _id: '66505ffeaf6a3c7411d2f62c', name: 'Odisha', alias: 'odisha' },
  { _id: '66505ffe91ab653d60a3df2d', name: 'Sikkim', alias: 'sikkim' },
  { _id: '66505ffe78117873bb53b6ad', name: 'Tripura', alias: 'tripura' },
  { _id: '66505ffd998183e1b1935e21', name: 'Mizoram', alias: 'mizoram' },
  { _id: '66505ffd672747740fb389c7', name: 'Meghalaya', alias: 'meghalaya' },
  { _id: '66505ffd24e61363e088c4a5', name: 'Nagaland', alias: 'nagaland' },
  { _id: '66505ffbf40e263cf5588098', name: 'Manipur', alias: 'manipur' },
  { _id: '66505ffb998183e1b1935dee', name: 'Jharkhand', alias: 'jharkhand' },
  { _id: '66505ffb6510ee3d5903fef8', name: 'Assam', alias: 'assam' },
  { _id: '66505ff9af6a3c7411d2f55f', name: 'Bihar', alias: 'bihar' },
  { _id: '66505ff978117873bb53b643', name: 'Arunachal Pradesh', alias: 'arunachal-pradesh' },
  { _id: '66505ff924e61363e088c414', name: 'Uttar Pradesh E', alias: 'uttar-pradesh-e' },
  { _id: '66505ff8c8f2d6e221b9180c', name: 'UP NCR', alias: 'up-ncr' },
  { _id: '66505ff8a7cddee1b8adae9d', name: 'Uttrakhand', alias: 'uttrakhand' },
  { _id: '66505ff824e61363e088c3dd', name: 'Rajasthan', alias: 'rajasthan' },
  { _id: '66505ff6f40e263cf5587fb5', name: 'J&K', alias: 'jandk' },
  { _id: '66505ff6d9346de216752cd7', name: 'Madhya Pradesh', alias: 'madhya-pradesh' },
  { _id: '66505ff6145c16635e6cc7c1', name: 'Ladakh', alias: 'ladakh' },
  { _id: '66505ff5af6a3c7411d2f4b2', name: 'Haryana', alias: 'haryana' },
  { _id: '66505ff578117873bb53b56a', name: 'Tamil Nadu', alias: 'tamil-nadu-1' },
  { _id: '66505ff5145c16635e6cc74d', name: 'Delhi', alias: 'delhi' },
  { _id: '66505ff3998183e1b1935d0e', name: 'Punjab', alias: 'punjab' },
  { _id: '66505ff378117873bb53b542', name: 'Andhra Pradesh', alias: 'andhra-pradesh' },
  { _id: '66505ff312a50963f24870e8', name: 'Pondicherry', alias: 'pondicherry' },
  { _id: '66505ff2998183e1b1935ccd', name: 'Kerala', alias: 'kerala' },
  { _id: '66505ff26510ee3d5903fda9', name: 'Himachal Pradesh', alias: 'himachal-pradesh' },
  { _id: '66505ff1672747740fb388ec', name: 'Chandigarh', alias: 'chandigarh' },
  { _id: '66505ff0998183e1b1935c75', name: 'Karnataka', alias: 'karnataka' },
  { _id: '66505ff06510ee3d5903fd42', name: 'Gujarat', alias: 'gujarat' },
  { _id: '66505ff024e61363e088c306', name: 'Daman & DIU', alias: 'daman-and-diu' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  for (const s of substores) {
    await Substore.updateOne(
      { alias: s.alias },
      { name: s.name, alias: s.alias, substoreId: s._id },
      { upsert: true }
    );
  }
  console.log('✅ Substore mapping seeded!');
  await mongoose.disconnect();
}

seed(); 