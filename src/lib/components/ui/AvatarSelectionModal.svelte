<script>
    /**
     * Props que recibe el modal:
     * - isOpen: Un booleano para controlar la visibilidad.
     * - currentAvatar: La URL del avatar actualmente seleccionado para resaltarlo.
     * - onSelect: Callback que se ejecuta cuando se selecciona un avatar.
     * - onClose: Callback que se ejecuta para cerrar el modal.
     */
    let { isOpen = false, currentAvatar = '', onSelect, onClose } = $props();

    let dialogElement;
    
    const avatarUrls = [
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurvy&accessoriesType=Wayfarers&hairColor=Black&facialHairType=Blank&facialHairColor=Auburn&clotheType=ShirtCrewNeck&clotheColor=Blue03&eyeType=EyeRoll&eyebrowType=UnibrowNatural&mouthType=Default&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat1&accessoriesType=Round&hatColor=White&hairColor=Red&facialHairType=BeardLight&facialHairColor=Blonde&clotheType=ShirtScoopNeck&clotheColor=Black&eyeType=Surprised&eyebrowType=Default&mouthType=Concerned&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBigHair&accessoriesType=Sunglasses&hatColor=Black&hairColor=Blue&facialHairType=BeardMedium&facialHairColor=Red&clotheType=ShirtScoopNeck&clotheColor=Blue03&eyeType=Default&eyebrowType=AngryNatural&mouthType=Concerned&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFrida&accessoriesType=Prescription01&hairColor=Blonde&facialHairType=MoustacheFancy&facialHairColor=BlondeGolden&clotheType=Hoodie&clotheColor=PastelGreen&eyeType=EyeRoll&eyebrowType=FlatNatural&mouthType=Serious&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurly&accessoriesType=Sunglasses&hairColor=Red&facialHairType=MoustacheMagnum&facialHairColor=Blonde&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Deer&eyeType=Cry&eyebrowType=Default&mouthType=Sad&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads02&accessoriesType=Sunglasses&hairColor=Blonde&facialHairType=MoustacheFancy&facialHairColor=BlondeGolden&clotheType=ShirtCrewNeck&clotheColor=Black&graphicType=Hola&eyeType=Close&eyebrowType=AngryNatural&mouthType=Serious&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShaggyMullet&accessoriesType=Prescription01&hairColor=BrownDark&facialHairType=BeardMajestic&facialHairColor=BrownDark&clotheType=BlazerShirt&clotheColor=PastelYellow&eyeType=WinkWacky&eyebrowType=UpDown&mouthType=Disbelief&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBigHair&accessoriesType=Round&hairColor=Black&facialHairType=BeardMajestic&facialHairColor=BrownDark&clotheType=GraphicShirt&clotheColor=Blue01&graphicType=Skull&eyeType=EyeRoll&eyebrowType=Default&mouthType=Disbelief&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Wayfarers&hairColor=BrownDark&facialHairType=BeardMajestic&facialHairColor=Platinum&clotheType=ShirtCrewNeck&clotheColor=PastelGreen&graphicType=Cumbia&eyeType=Wink&eyebrowType=AngryNatural&mouthType=Disbelief&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShaggyMullet&accessoriesType=Prescription01&hairColor=Auburn&facialHairType=Blank&facialHairColor=Black&clotheType=ShirtVNeck&clotheColor=Blue03&eyeType=Wink&eyebrowType=UpDownNatural&mouthType=ScreamOpen&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Blank&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=Blonde&clotheType=GraphicShirt&clotheColor=PastelYellow&graphicType=Cumbia&eyeType=WinkWacky&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=NoHair&accessoriesType=Prescription02&hairColor=SilverGray&facialHairType=BeardMedium&facialHairColor=Auburn&clotheType=GraphicShirt&clotheColor=PastelRed&graphicType=Bat&eyeType=Wink&eyebrowType=AngryNatural&mouthType=Vomit&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Round&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Blonde&clotheType=BlazerSweater&clotheColor=Blue02&graphicType=Bat&eyeType=WinkWacky&eyebrowType=UpDown&mouthType=Sad&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat2&accessoriesType=Blank&hatColor=Blue01&hairColor=Red&facialHairType=MoustacheFancy&facialHairColor=Brown&clotheType=Hoodie&clotheColor=PastelYellow&eyeType=Surprised&eyebrowType=Default&mouthType=Serious&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Wayfarers&hatColor=Heather&hairColor=SilverGray&facialHairType=BeardMajestic&facialHairColor=Auburn&clotheType=ShirtCrewNeck&clotheColor=Pink&eyeType=Cry&eyebrowType=Default&mouthType=Grimace&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Sunglasses&hairColor=PastelPink&facialHairType=Blank&facialHairColor=Red&clotheType=Hoodie&clotheColor=PastelYellow&eyeType=Side&eyebrowType=UnibrowNatural&mouthType=Grimace&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Prescription01&hairColor=Auburn&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=PastelRed&eyeType=Surprised&eyebrowType=AngryNatural&mouthType=ScreamOpen&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Wayfarers&hairColor=Blue&facialHairType=BeardMajestic&facialHairColor=Brown&clotheType=CollarSweater&clotheColor=Black&eyeType=Surprised&eyebrowType=FlatNatural&mouthType=Serious&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShaggyMullet&accessoriesType=Prescription02&hairColor=Red&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&clotheColor=PastelRed&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Twinkle&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Kurt&hairColor=PastelPink&facialHairType=Blank&facialHairColor=Platinum&clotheType=ShirtCrewNeck&clotheColor=PastelOrange&eyeType=Dizzy&eyebrowType=SadConcerned&mouthType=Vomit&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&accessoriesType=Prescription01&hatColor=Gray02&hairColor=SilverGray&facialHairType=BeardLight&clotheType=ShirtCrewNeck&clotheColor=PastelGreen&eyeType=WinkWacky&eyebrowType=UpDown&mouthType=ScreamOpen&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShaggyMullet&accessoriesType=Wayfarers&hatColor=Blue03&hairColor=Black&facialHairType=MoustacheMagnum&facialHairColor=BrownDark&clotheType=Hoodie&clotheColor=PastelOrange&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Eating&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Prescription02&hairColor=Platinum&facialHairType=BeardLight&facialHairColor=BlondeGolden&clotheType=ShirtScoopNeck&clotheColor=PastelGreen&eyeType=Happy&eyebrowType=RaisedExcitedNatural&mouthType=Vomit&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=MoustacheMagnum&facialHairColor=Brown&clotheType=Overall&clotheColor=Blue01&eyeType=Surprised&eyebrowType=UpDownNatural&mouthType=Twinkle&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Round&hairColor=BrownDark&facialHairType=MoustacheMagnum&facialHairColor=Platinum&clotheType=Hoodie&clotheColor=Blue02&eyeType=Side&eyebrowType=RaisedExcitedNatural&mouthType=Concerned&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Blank&hairColor=Red&facialHairType=MoustacheMagnum&facialHairColor=Black&clotheType=Overall&clotheColor=Gray01&eyeType=Surprised&eyebrowType=SadConcernedNatural&mouthType=Grimace&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Prescription02&hairColor=BrownDark&facialHairType=BeardLight&facialHairColor=Black&clotheType=GraphicShirt&clotheColor=Blue03&graphicType=Cumbia&eyeType=Cry&eyebrowType=DefaultNatural&mouthType=Disbelief&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurly&accessoriesType=Wayfarers&hairColor=Auburn&facialHairType=BeardMajestic&facialHairColor=Red&clotheType=ShirtCrewNeck&clotheColor=White&graphicType=Bear&eyeType=Hearts&eyebrowType=Default&mouthType=Grimace&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairMiaWallace&accessoriesType=Prescription02&hairColor=Blonde&facialHairType=BeardMedium&facialHairColor=BlondeGolden&clotheType=ShirtScoopNeck&clotheColor=White&eyeType=Wink&eyebrowType=FlatNatural&mouthType=Concerned&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Prescription02&hairColor=SilverGray&facialHairType=BeardMajestic&facialHairColor=Auburn&clotheType=Hoodie&clotheColor=White&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Sad&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Sunglasses&hairColor=Platinum&facialHairType=BeardMajestic&facialHairColor=Black&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Bat&eyeType=Side&eyebrowType=UnibrowNatural&mouthType=Sad&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBob&accessoriesType=Blank&hairColor=Auburn&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=ShirtCrewNeck&clotheColor=White&graphicType=Hola&eyeType=Happy&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=NoHair&accessoriesType=Prescription02&hairColor=Auburn&facialHairType=MoustacheFancy&facialHairColor=Auburn&clotheType=ShirtScoopNeck&clotheColor=Red&eyeType=Happy&eyebrowType=UpDown&mouthType=Sad&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairNotTooLong&accessoriesType=Blank&hairColor=Brown&facialHairType=BeardMedium&facialHairColor=Platinum&clotheType=ShirtVNeck&clotheColor=White&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Sad&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hat&accessoriesType=Wayfarers&hairColor=Blonde&facialHairType=BeardMajestic&facialHairColor=BlondeGolden&clotheType=ShirtScoopNeck&clotheColor=White&eyeType=Default&eyebrowType=UpDown&mouthType=Disbelief&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurly&accessoriesType=Kurt&hairColor=Blue&facialHairType=Blank&facialHairColor=Blonde&clotheType=ShirtCrewNeck&clotheColor=Gray02&eyeType=Happy&eyebrowType=UnibrowNatural&mouthType=Disbelief&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat3&accessoriesType=Blank&hatColor=Blue03&hairColor=Platinum&facialHairType=Blank&clotheType=Overall&clotheColor=Blue01&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&accessoriesType=Wayfarers&hatColor=Blue01&hairColor=SilverGray&facialHairType=BeardMedium&facialHairColor=Red&clotheType=ShirtScoopNeck&clotheColor=Gray02&eyeType=Surprised&eyebrowType=SadConcerned&mouthType=Smile&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat3&accessoriesType=Round&hatColor=PastelRed&hairColor=Brown&facialHairType=BeardMedium&facialHairColor=Auburn&clotheType=ShirtScoopNeck&clotheColor=PastelYellow&eyeType=Wink&eyebrowType=RaisedExcited&mouthType=Serious&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat4&accessoriesType=Prescription02&hatColor=Black&facialHairType=MoustacheMagnum&facialHairColor=Black&clotheType=ShirtCrewNeck&clotheColor=PastelYellow&eyeType=WinkWacky&eyebrowType=FlatNatural&mouthType=Eating&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairSides&accessoriesType=Sunglasses&hatColor=Blue03&hairColor=Black&facialHairType=BeardMajestic&facialHairColor=Platinum&clotheType=BlazerShirt&clotheColor=PastelRed&eyeType=Surprised&eyebrowType=Default&mouthType=Default&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Kurt&hairColor=Blonde&facialHairType=MoustacheMagnum&facialHairColor=Auburn&clotheType=BlazerShirt&eyeType=Happy&eyebrowType=AngryNatural&mouthType=Twinkle&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&accessoriesType=Wayfarers&hairColor=Blonde&facialHairType=BeardMedium&facialHairColor=Black&clotheType=Hoodie&clotheColor=White&eyeType=Surprised&eyebrowType=RaisedExcitedNatural&mouthType=Serious&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hat&accessoriesType=Kurt&hairColor=BrownDark&facialHairType=BeardMajestic&facialHairColor=Red&clotheType=Overall&clotheColor=PastelBlue&eyeType=Close&eyebrowType=UpDown&mouthType=Grimace&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Turban&accessoriesType=Sunglasses&hatColor=Pink&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtVNeck&clotheColor=Heather&eyeType=Hearts&eyebrowType=UpDownNatural&mouthType=Concerned&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=PastelPink&facialHairType=BeardLight&facialHairColor=Brown&clotheType=Hoodie&clotheColor=PastelBlue&eyeType=Hearts&eyebrowType=AngryNatural&mouthType=Vomit&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Sunglasses&hairColor=Auburn&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=BlazerShirt&clotheColor=Red&eyeType=Happy&eyebrowType=SadConcernedNatural&mouthType=Tongue&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight2&accessoriesType=Kurt&hairColor=Red&facialHairType=MoustacheFancy&facialHairColor=Blonde&clotheType=BlazerShirt&eyeType=Surprised&eyebrowType=FlatNatural&mouthType=ScreamOpen&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBob&accessoriesType=Prescription01&hairColor=Brown&facialHairType=MoustacheFancy&facialHairColor=Black&clotheType=Hoodie&clotheColor=Red&eyeType=Close&eyebrowType=Default&mouthType=Default&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Kurt&hairColor=Blonde&facialHairType=BeardMedium&facialHairColor=Blonde&clotheType=CollarSweater&clotheColor=Pink&eyeType=Happy&eyebrowType=RaisedExcited&mouthType=Tongue&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Blank&hairColor=Red&facialHairType=BeardMedium&facialHairColor=Brown&clotheType=Overall&clotheColor=PastelGreen&eyeType=EyeRoll&eyebrowType=FlatNatural&mouthType=Disbelief&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Prescription02&hairColor=Black&facialHairType=MoustacheFancy&facialHairColor=Red&clotheType=ShirtCrewNeck&clotheColor=PastelBlue&eyeType=Hearts&eyebrowType=UnibrowNatural&mouthType=Twinkle&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat3&accessoriesType=Prescription01&hatColor=PastelYellow&hairColor=BrownDark&facialHairType=Blank&facialHairColor=BlondeGolden&clotheType=ShirtVNeck&clotheColor=Blue02&eyeType=Cry&eyebrowType=AngryNatural&mouthType=Eating&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Wayfarers&hatColor=PastelOrange&hairColor=Brown&facialHairType=MoustacheMagnum&facialHairColor=Platinum&clotheType=ShirtVNeck&clotheColor=Pink&eyeType=Cry&eyebrowType=FlatNatural&mouthType=Concerned&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight&accessoriesType=Sunglasses&hairColor=Blue&facialHairType=MoustacheMagnum&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=Gray01&eyeType=WinkWacky&eyebrowType=SadConcernedNatural&mouthType=ScreamOpen&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairMiaWallace&accessoriesType=Prescription02&hairColor=Brown&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=GraphicShirt&clotheColor=Heather&graphicType=Skull&eyeType=Surprised&eyebrowType=AngryNatural&mouthType=Vomit&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hijab&accessoriesType=Round&hatColor=Heather&hairColor=Platinum&facialHairType=BeardMedium&facialHairColor=Blonde&clotheType=ShirtScoopNeck&clotheColor=Gray02&graphicType=Resist&eyeType=Surprised&eyebrowType=AngryNatural&mouthType=Serious&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairFrizzle&accessoriesType=Round&hatColor=Black&hairColor=Brown&facialHairType=BeardMedium&facialHairColor=Platinum&clotheType=ShirtCrewNeck&clotheColor=Gray01&eyeType=Close&eyebrowType=SadConcerned&mouthType=Sad&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairMiaWallace&accessoriesType=Prescription02&hairColor=PastelPink&facialHairType=MoustacheMagnum&facialHairColor=Red&clotheType=Overall&clotheColor=PastelGreen&eyeType=Hearts&eyebrowType=SadConcernedNatural&mouthType=Serious&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Kurt&hairColor=BlondeGolden&facialHairType=MoustacheMagnum&facialHairColor=Auburn&clotheType=BlazerSweater&clotheColor=Blue01&eyeType=Squint&eyebrowType=UnibrowNatural&mouthType=Smile&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Sunglasses&hairColor=Blonde&facialHairType=MoustacheMagnum&facialHairColor=Platinum&clotheType=BlazerSweater&eyeType=Cry&eyebrowType=DefaultNatural&mouthType=Sad&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairShavedSides&accessoriesType=Prescription01&hairColor=Brown&facialHairType=MoustacheFancy&facialHairColor=BlondeGolden&clotheType=Overall&clotheColor=Red&eyeType=Squint&eyebrowType=Default&mouthType=Smile&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBigHair&accessoriesType=Round&hairColor=Black&facialHairType=BeardMedium&facialHairColor=BlondeGolden&clotheType=Overall&clotheColor=PastelOrange&eyeType=Side&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBigHair&accessoriesType=Kurt&hairColor=Blonde&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=BlazerSweater&clotheColor=Pink&eyeType=Surprised&eyebrowType=Default&mouthType=Grimace&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Round&hairColor=Red&facialHairType=BeardMajestic&facialHairColor=Blonde&clotheType=ShirtScoopNeck&clotheColor=PastelRed&eyeType=Close&eyebrowType=UnibrowNatural&mouthType=Grimace&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairNotTooLong&accessoriesType=Prescription02&hairColor=Brown&facialHairType=BeardLight&facialHairColor=BlondeGolden&clotheType=ShirtScoopNeck&clotheColor=Blue02&eyeType=Dizzy&eyebrowType=RaisedExcitedNatural&mouthType=ScreamOpen&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesarSidePart&accessoriesType=Sunglasses&hairColor=BlondeGolden&facialHairType=MoustacheMagnum&facialHairColor=Auburn&clotheType=Overall&clotheColor=Pink&eyeType=Wink&eyebrowType=UpDownNatural&mouthType=Eating&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Blank&hairColor=Brown&facialHairType=BeardMajestic&facialHairColor=Red&clotheType=Overall&clotheColor=PastelYellow&eyeType=Surprised&eyebrowType=Default&mouthType=Twinkle&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat4&accessoriesType=Prescription01&hatColor=Red&hairColor=BrownDark&facialHairType=BeardMajestic&facialHairColor=Auburn&clotheType=Overall&clotheColor=Black&eyeType=Side&eyebrowType=RaisedExcitedNatural&mouthType=Sad&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Turban&accessoriesType=Prescription01&hatColor=Blue01&facialHairType=BeardLight&facialHairColor=Red&clotheType=BlazerSweater&clotheColor=Blue03&eyeType=Side&eyebrowType=DefaultNatural&mouthType=Vomit&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFrida&accessoriesType=Prescription01&hatColor=Gray01&facialHairType=BeardLight&facialHairColor=Red&clotheType=Overall&clotheColor=Pink&eyeType=Hearts&eyebrowType=UnibrowNatural&mouthType=Vomit&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairSides&accessoriesType=Blank&hairColor=BrownDark&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=Hoodie&clotheColor=Red&eyeType=Dizzy&eyebrowType=SadConcernedNatural&mouthType=Twinkle&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairTheCaesar&accessoriesType=Round&hairColor=Brown&facialHairType=MoustacheMagnum&facialHairColor=Blonde&clotheType=GraphicShirt&clotheColor=PastelGreen&graphicType=Diamond&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Sad&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Eyepatch&accessoriesType=Blank&hairColor=Platinum&facialHairType=BeardMajestic&facialHairColor=BlondeGolden&clotheType=GraphicShirt&clotheColor=Blue01&graphicType=Pizza&eyeType=Surprised&eyebrowType=AngryNatural&mouthType=Tongue&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Blank&hairColor=Platinum&facialHairType=BeardMajestic&facialHairColor=Blonde&clotheType=BlazerShirt&clotheColor=PastelGreen&graphicType=Selena&eyeType=Close&eyebrowType=UnibrowNatural&mouthType=Tongue&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFro&accessoriesType=Sunglasses&hairColor=Platinum&facialHairType=MoustacheMagnum&facialHairColor=Red&clotheType=Hoodie&clotheColor=Heather&eyeType=Cry&eyebrowType=Default&mouthType=Smile&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairFrizzle&accessoriesType=Blank&hairColor=Platinum&facialHairType=MoustacheMagnum&facialHairColor=Blonde&clotheType=CollarSweater&clotheColor=Heather&eyeType=Surprised&eyebrowType=Default&mouthType=Serious&skinColor=Brown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortRound&accessoriesType=Wayfarers&hairColor=Black&facialHairType=BeardLight&facialHairColor=BlondeGolden&clotheType=GraphicShirt&clotheColor=PastelGreen&graphicType=Hola&eyeType=WinkWacky&eyebrowType=Default&mouthType=Sad&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBob&accessoriesType=Blank&hairColor=SilverGray&facialHairType=MoustacheMagnum&facialHairColor=Blonde&clotheType=ShirtScoopNeck&clotheColor=Blue03&graphicType=Skull&eyeType=Squint&eyebrowType=AngryNatural&mouthType=Smile&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Blank&hairColor=BlondeGolden&facialHairType=BeardMedium&facialHairColor=Auburn&clotheType=Hoodie&clotheColor=Blue01&eyeType=Surprised&eyebrowType=Angry&mouthType=Vomit&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortCurly&accessoriesType=Prescription02&hairColor=Red&facialHairType=Blank&facialHairColor=Auburn&clotheType=Overall&clotheColor=Heather&eyeType=Side&eyebrowType=SadConcernedNatural&mouthType=Vomit&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=Hat&accessoriesType=Sunglasses&hairColor=Black&facialHairType=BeardLight&facialHairColor=Blonde&clotheType=ShirtScoopNeck&clotheColor=Pink&eyeType=Happy&eyebrowType=RaisedExcited&mouthType=ScreamOpen&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Kurt&hairColor=PastelPink&facialHairType=BeardMajestic&facialHairColor=Auburn&clotheType=BlazerSweater&clotheColor=PastelBlue&eyeType=Dizzy&eyebrowType=FlatNatural&mouthType=Serious&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurvy&accessoriesType=Wayfarers&hairColor=Auburn&facialHairType=Blank&facialHairColor=Red&clotheType=ShirtVNeck&clotheColor=Gray01&eyeType=WinkWacky&eyebrowType=FlatNatural&mouthType=Smile&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairShavedSides&accessoriesType=Wayfarers&hairColor=Blonde&facialHairType=BeardMedium&facialHairColor=Blonde&clotheType=BlazerShirt&clotheColor=Blue03&eyeType=Default&eyebrowType=FlatNatural&mouthType=Eating&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads02&accessoriesType=Prescription02&hairColor=Black&facialHairType=BeardMajestic&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=WinkWacky&eyebrowType=SadConcerned&mouthType=Default&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairMiaWallace&accessoriesType=Wayfarers&hairColor=BlondeGolden&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=GraphicShirt&clotheColor=PastelYellow&graphicType=Hola&eyeType=Happy&eyebrowType=UnibrowNatural&mouthType=Tongue&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat3&accessoriesType=Prescription01&hatColor=PastelYellow&hairColor=BrownDark&facialHairType=Blank&facialHairColor=BrownDark&clotheType=Hoodie&clotheColor=PastelRed&graphicType=Hola&eyeType=Hearts&eyebrowType=UnibrowNatural&mouthType=Eating&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Wayfarers&hatColor=Red&hairColor=BlondeGolden&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=ShirtVNeck&clotheColor=PastelYellow&eyeType=Surprised&eyebrowType=UpDownNatural&mouthType=Concerned&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBigHair&accessoriesType=Kurt&hairColor=Blue&facialHairType=Blank&facialHairColor=BlondeGolden&clotheType=BlazerShirt&clotheColor=Blue02&eyeType=EyeRoll&eyebrowType=Default&mouthType=Disbelief&skinColor=Tanned",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat4&accessoriesType=Wayfarers&hatColor=Blue02&hairColor=SilverGray&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=Blue01&eyeType=Hearts&eyebrowType=UpDown&mouthType=Concerned&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Prescription02&hatColor=PastelGreen&hairColor=Brown&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=White&eyeType=Surprised&eyebrowType=DefaultNatural&mouthType=Sad&skinColor=Pale",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraightStrand&accessoriesType=Sunglasses&hairColor=Platinum&facialHairType=MoustacheMagnum&facialHairColor=Black&clotheType=GraphicShirt&clotheColor=Gray02&graphicType=Deer&eyeType=Wink&eyebrowType=RaisedExcited&mouthType=Twinkle&skinColor=Yellow",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairBob&accessoriesType=Kurt&hairColor=BrownDark&facialHairType=BeardMajestic&facialHairColor=Platinum&clotheType=ShirtScoopNeck&clotheColor=Pink&graphicType=Bat&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=ScreamOpen&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairShortWaved&accessoriesType=Sunglasses&hairColor=Blue&facialHairType=BeardMedium&facialHairColor=Platinum&clotheType=ShirtScoopNeck&clotheColor=PastelRed&eyeType=Dizzy&eyebrowType=DefaultNatural&mouthType=Concerned&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairCurvy&accessoriesType=Sunglasses&hairColor=BrownDark&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=CollarSweater&clotheColor=Black&eyeType=Cry&eyebrowType=AngryNatural&mouthType=Default&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=WinterHat4&accessoriesType=Kurt&hatColor=Blue01&hairColor=Red&facialHairType=MoustacheMagnum&facialHairColor=Platinum&clotheType=BlazerSweater&clotheColor=Blue02&eyeType=Close&eyebrowType=FlatNatural&mouthType=Smile&skinColor=DarkBrown",
    "https://avataaars.io/?avatarStyle=Transparent&topType=LongHairFrida&accessoriesType=Blank&hatColor=Pink&facialHairType=MoustacheMagnum&facialHairColor=BlondeGolden&clotheType=Overall&clotheColor=Blue01&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Concerned&skinColor=Black",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairFrizzle&accessoriesType=Wayfarers&hairColor=Brown&facialHairType=MoustacheFancy&facialHairColor=Blonde&clotheType=GraphicShirt&clotheColor=Black&graphicType=SkullOutline&eyeType=Surprised&eyebrowType=FlatNatural&mouthType=Eating&skinColor=Light",
    "https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads02&accessoriesType=Prescription01&hairColor=SilverGray&facialHairType=MoustacheFancy&facialHairColor=Brown&clotheType=ShirtScoopNeck&clotheColor=Gray01&graphicType=Cumbia&eyeType=Default&eyebrowType=Angry&mouthType=Eating&skinColor=Yellow"
];

    $effect(() => {
        if (dialogElement) {
            if (isOpen) {
                dialogElement.showModal();
            } else {
                dialogElement.close();
            }
        }
    });

    function handleSelect(url) {
        if (onSelect) {
            onSelect(url);
        }
    }
</script>


<dialog bind:this={dialogElement} class="modal" onclose={onClose}>
    <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg">Selecciona tu Avatar</h3>
        
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 py-4 overflow-y-auto max-h-[60vh]">
            {#each avatarUrls as url}
                <button
                    onclick={() => handleSelect(url)}
                    class="avatar rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    class:ring-2={currentAvatar === url}
                    class:ring-primary={currentAvatar === url}
                    class:ring-offset-base-100={currentAvatar === url}
                    class:ring-offset-2={currentAvatar === url}
                    aria-label="Seleccionar avatar"
                >
                    <div class="w-24 rounded-full">
                        <img src={url} alt="Avatar" />
                    </div>
                </button>
            {/each}
        </div>
        
        <div class="modal-action">
            
            <form method="dialog">
                <button class="btn">Cerrar</button>
            </form>
        </div>
    </div>
     <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>