// 프로필 사진 데이터
export const profileImages = [
    {
        id: 1,
        name: '기본',
        image: require('../assets/images/avatar1.png')
    },
    {
        id: 2,
        name: '빛나는',
        image: require('../assets/images/avatar2.png')
    },
    {
        id: 3,
        name: '따뜻한',
        image: require('../assets/images/avatar3.png')
    },
    {
        id: 4,
        name: '밤하늘',
        image: require('../assets/images/avatar4.png')
    },
    {
        id: 5,
        name: '상쾌한',
        image: require('../assets/images/avatar5.png')
    }
];

// 캐릭터 데이터
export const characters = [
    {
        id: 1,
        name: '망키',
        image: require('../assets/character_image/mangkee_character.png'),
        level: 1,
        description: '망키'
    },
    {
        id: 2,
        name: '썬글라스 망키', 
        image: require('../assets/character_image/sunglass_mangkee.png'),
        level: 10,
        description: '썬글라스 망키'
    },
    {
        id: 3,
        name: '캡 망키',
        image: require('../assets/character_image/cap_mangkee.png'),
        level: 20,
        description: '캡 망키'
    },
    {
        id: 4,
        name: '겨울 러너 망키',
        image: require('../assets/character_image/winter_runner_mangkee.png'),
        level: 30,
        description: '겨울 러너 망키'
    }
];

// 기본 캐릭터 (fallback)
export const defaultCharacter = {
    name: '망키',
    image: require('../assets/character_image/mangkee_character.png')
};

// 캐릭터 ID로 캐릭터 찾기
export const getCharacterById = (id) => {
    return characters.find(char => char.id === parseInt(id));
};

// 프로필 사진 ID로 찾기
export const getProfileImageById = (id) => {
    return profileImages.find(img => img.id === parseInt(id));
};

// 기본 캐릭터 또는 선택된 캐릭터 반환
export const getSelectedCharacterOrDefault = (selectedCharacter) => {
    return selectedCharacter || characters[0];
};