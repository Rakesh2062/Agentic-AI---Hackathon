import asyncio
from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION

async def fix_complaints():
    db = get_db()
    
    # Check existing distinct departments
    distinct_depts = await db[COMPLAINTS_COLLECTION].distinct('department')
    print(f'Distinct departments before update: {distinct_depts}')
    
    # Mapping of old incorrect departments to new official ones
    updates = {
        'Roads & Pavements': 'Roads & Infrastructure',
        'Roads': 'Roads & Infrastructure',
        'Water': 'Water & Sewage Board',
        'Sanitation': 'Solid Waste Management',
        'Drainage': 'Stormwater & Drainage',
        'Streetlights': 'Street Lighting & Electrical',
        'Public Facilities': 'Parks & Urban Forestry',
    }
    
    total_updated = 0
    for old_dept, new_dept in updates.items():
        result = await db[COMPLAINTS_COLLECTION].update_many(
            {'department': old_dept},
            {'$set': {'department': new_dept}}
        )
        if result.modified_count > 0:
            print(f'Updated {result.modified_count} complaints from "{old_dept}" to "{new_dept}"')
            total_updated += result.modified_count
            
    # Also update any lowercase or similar variants for Roads
    result = await db[COMPLAINTS_COLLECTION].update_many(
        {'department': {'$regex': 'road.*pavement', '$options': 'i'}},
        {'$set': {'department': 'Roads & Infrastructure'}}
    )
    if result.modified_count > 0:
        print(f'Updated {result.modified_count} regex match complaints to "Roads & Infrastructure"')
        total_updated += result.modified_count
        
    print(f'Total updated: {total_updated}')

    # Check distinct after update
    distinct_depts = await db[COMPLAINTS_COLLECTION].distinct('department')
    print(f'Distinct departments after update: {distinct_depts}')

asyncio.run(fix_complaints())
