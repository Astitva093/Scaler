from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Booking, Favorite, Listing, Review, User

PHOTOS = [
    "/stays/glasshouse.jpg", "/stays/tidepool-villa.jpg", "/stays/heritage-haveli.jpg",
    "/stays/pine-cabin.jpg", "/stays/bandra-loft.jpg", "/stays/coorg-treehouse.jpg", "/stays/kerala-houseboat.jpg",
]

STAYS = [
    (2,"Glasshouse above the valley","Mountain and valley views","Manali","Cabin","Amazing views",18600,4,2,2,2,4.96,128,"Guest favourite",0),
    (3,"Tidepool villa with infinity pool","Steps from a quiet beach","Siolim","Villa","Beachfront",24400,6,3,3,3,4.92,86,"Guest favourite",1),
    (2,"Heritage courtyard haveli","A restored 1890s residence","Jaipur","House","Design",13200,5,2,3,2,4.89,204,"Rare find",2),
    (4,"Pine cabin beside the river","A private forest hideaway","Kasol","Cabin","Cabins",9800,3,1,2,1,4.87,73,None,3),
    (3,"Minimal loft in Bandra","Walk to cafés and the sea","Mumbai","Apartment","Urban",11600,2,1,1,1,4.84,151,"Guest favourite",4),
    (4,"Tea estate bungalow","Among the Munnar hills","Munnar","Bungalow","Countryside",15400,6,3,4,3,4.95,92,"Top 5% of homes",5),
    (2,"Houseboat on the backwaters","Slow living in Alleppey","Alleppey","Houseboat","Boats",19300,4,2,2,2,4.93,175,"Guest favourite",6),
    (3,"Coffee-country treehouse","Floating above the canopy","Coorg","Treehouse","Treehouses",13900,2,1,1,1,4.97,49,"Top 1% of homes",5),
]


def seed_database(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return
    db.add_all([
        User(id=1,name="Maya Kapoor",email="maya@airbnb.demo",role="guest",bio="Slow traveller and architecture lover."),
        User(id=2,name="Aarav Mehta",email="aarav@airbnb.demo",role="host",bio="I host design-led homes across India.",is_superhost=True),
        User(id=3,name="Nila & Dev",email="nila@airbnb.demo",role="host",bio="Warm, local hospitality.",is_superhost=True),
        User(id=4,name="Kabir Singh",email="kabir@airbnb.demo",role="host",bio="Nature stays and good coffee."),
    ])
    db.flush()
    for idx, row in enumerate(STAYS, 1):
        host,title,subtitle,city,ptype,category,price,capacity,bedrooms,beds,baths,rating,reviews,badge,photo = row
        db.add(Listing(id=idx,host_id=host,title=title,subtitle=subtitle,description=f"{subtitle}. A thoughtfully hosted Airbnb stay with locally inspired details and everything needed for a comfortable visit.",city=city,country="India",price=price,cleaning_fee=round(price*.18),property_type=ptype,category=category,guest_capacity=capacity,bedrooms=bedrooms,beds=beds,baths=baths,rating=rating,review_count=reviews,badge=badge,amenities=["Wifi","Kitchen","Free parking","Dedicated workspace"],images=[PHOTOS[photo],PHOTOS[(photo+1)%len(PHOTOS)],PHOTOS[(photo+2)%len(PHOTOS)]]))
    db.flush()
    db.add_all([
        Review(listing_id=1,user_id=1,rating=5,comment="The sunrise and thoughtful design were unforgettable."),
        Booking(listing_id=2,guest_id=1,check_in=date(2026,8,21),check_out=date(2026,8,24),guests=2,nights=3,subtotal=73200,cleaning_fee=4500,service_fee=8784,total=86484,status="confirmed",confirmation_code="AIR-8G2KQ"),
        Favorite(user_id=1,listing_id=3), Favorite(user_id=1,listing_id=7),
    ])
    db.commit()
