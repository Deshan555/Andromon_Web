// All the words on the homepage. The FAQ here is also written into the page's
// structured data, so the two can't drift apart.
'use strict';

module.exports = (site) => {
  const N = site.name;
  return {
    hero: {
      h1: 'The Android phone manager for your computer',
      lead: `${N} puts your phone's screen, messages, files, photos and apps in one desktop window. Plug the phone in and it connects by itself, over USB or Wi‑Fi. No account, no root, nothing to set up on the phone first.`,
      points: ['Connects as soon as you plug in', 'Works over USB or Wi‑Fi', 'No account or sign-in', 'No root needed'],
    },

    spotlights: [
      {
        id: 'screen-mirror',
        img: 'mirror',
        alt: `${N} mirroring an Android phone's screen in a desktop window, with Back, Home and Recents in a strip on the left and volume, media, capture and Record buttons on the right`,
        kicker: 'Screen mirror',
        h: 'Mirror your Android screen to your PC or Mac',
        p: 'See and use your phone in a window at up to 60 frames per second. The mouse works as touch, the keyboard types on the phone, and the clipboard is shared both ways. The phone\'s buttons sit in slim icon strips beside the screen.',
        list: [
          'Quality adjusts by itself so the picture keeps up, over USB or Wi‑Fi',
          'Phone sound on the computer (Android 11 and later)',
          'Record the screen to MP4, with sound',
          'Show the back or front camera instead of the screen (Android 12 and later)',
          'Turn the phone\'s own screen off while you mirror',
        ],
      },
      {
        id: 'text-from-computer',
        img: 'messages',
        alt: `${N}'s Messages page showing SMS conversations with a reply box on the computer`,
        kicker: 'Messages and calls',
        h: 'Send and read text messages from your computer',
        p: 'Your SMS and MMS conversations with contact names and pictures, a real keyboard to reply with, and search across everything. Incoming calls pop up on the computer, where you can answer, decline or silence them.',
        list: [
          'Reply to any app\'s notifications from the computer',
          'Export messages to XML or CSV, and restore them later',
          'Edit contacts and merge duplicates',
          'Call log with filters and export',
        ],
      },
      {
        id: 'file-transfer',
        img: 'photos',
        alt: `${N}'s Photos page showing an Android phone's gallery as thumbnails on the computer`,
        kicker: 'Files, photos and backup',
        h: 'Transfer files and photos between Android and PC',
        p: 'Browse the phone\'s storage, drag files in and out, and see the whole gallery as thumbnails. A backup saves contacts, messages, call log, calendar, apps and photos into one dated folder on your computer.',
        list: [
          'Copy new photos to the computer every time the phone connects',
          'Find duplicate photos and songs',
          'Send and receive files over Wi‑Fi, without a cable',
          'Restore a backup onto the same phone or a new one',
          'Recover deleted photos and files from an SD card or USB stick',
        ],
      },
      {
        id: 'debloat',
        img: 'apps',
        alt: `${N}'s Apps page listing the apps on an Android phone, with a drop area for installing APK files`,
        kicker: 'Apps and debloat',
        h: 'Remove bloatware from Android without root',
        p: 'See what each pre-installed app does and how safe it is to remove, from a community-maintained list. Removal is per user, so anything can be restored later from the same page.',
        list: [
          'Install APK, XAPK, APKS and APKM files by drag and drop',
          'Uninstall, disable, force stop or export any app',
          'Browse and install open-source apps from F-Droid, with screenshots',
          'Patch apps with ReVanced on the computer',
        ],
      },
    ],

    featuresTitle: 'Everything you can do with your phone connected',
    featuresLead: 'One window replaces a drawer full of single-purpose tools.',
    groups: [
      {
        title: 'Communication',
        items: [
          ['message', 'Messages', 'Read, search and send SMS and MMS. Export and restore conversations.'],
          ['user', 'Contacts', 'Edit contacts with photos, merge duplicates, import and export vCard.'],
          ['phone', 'Call log and call alerts', 'See who is calling on the computer. Answer, decline or silence.'],
          ['bell', 'Notifications', 'Every phone notification on your desktop, with reply and quick actions.'],
          ['calendar', 'Calendar', 'The phone\'s calendars as an agenda. Import and export .ics files.'],
        ],
      },
      {
        title: 'Files and media',
        items: [
          ['folder', 'File manager', 'Browse the phone\'s storage. Upload, download and delete.'],
          ['image', 'Photos and videos', 'The gallery by album, with a full-screen viewer and duplicate finder.'],
          ['music', 'Music', 'Songs, artists and albums. Play on the computer or copy either way.'],
          ['wifi', 'Wi‑Fi transfer', 'Send and receive files on the same network, or over a direct link from the phone.'],
          ['archive', 'Backup and restore', 'Contacts, messages, calls, calendar, apps and photos in one folder.'],
          ['card', 'SD card recovery', 'Get deleted photos, videos and files back from a memory card or USB stick.'],
        ],
      },
      {
        title: 'Device',
        items: [
          ['plug', 'Plug and go', 'Connects when the phone is plugged in, and keeps other adb tools off it.'],
          ['screen', 'Screen mirror', 'Use the phone from the computer, with sound and MP4 recording.'],
          ['grid', 'App manager', 'Install, uninstall, disable and export apps. Manage their permissions.'],
          ['broom', 'Debloat', 'Remove pre-installed apps safely, and bring them back if needed.'],
          ['sliders', 'Controls', 'Wi‑Fi, Bluetooth, brightness, volume, dark theme, reboot and more.'],
          ['camera', 'Screenshot', 'Capture the phone\'s screen and save it as a PNG.'],
        ],
      },
      {
        title: 'Developer and testing',
        items: [
          ['terminal', 'Shell and logcat', 'Run shell commands with saved snippets. Logcat with a crash finder.'],
          ['play', 'Test automation', 'Record a test by using the app, then replay it. HTML and JUnit reports.'],
          ['gauge', 'Performance tests', 'Startup time, smoothness and memory, with limits and history.'],
          ['network', 'API inspector', 'See the HTTP and HTTPS calls an app makes, and test APIs.'],
          ['pin', 'Device tools', 'Fake GPS location picked on a map, port forwarding, Perfetto traces and heap dumps.'],
        ],
      },
    ],

    companion: {
      h: 'A phone-care app comes with it',
      p: `${N} installs a small companion app on the phone when a feature needs it. It also works on its own as a cleaner and health check, with no ads.`,
      shots: [
        ['home', 'Companion app home screen showing storage, memory and PC link tiles'],
        ['cleaner', 'Companion app Cleaner screen showing junk files found on the phone'],
        ['battery', 'Companion app Battery screen showing battery level, temperature and history'],
      ],
      items: [
        ['Cleaner', 'Junk files, leftovers of removed apps, duplicates and large files.'],
        ['Battery', 'Condition, temperature, charge cycles and a seven-day history.'],
        ['Freezer', 'Stop apps that keep running in the background when you don\'t use them.'],
        ['Memory', 'What is using RAM right now, and one tap to free it.'],
        ['Storage analyzer', 'Folder sizes, largest first, so you see where the space went.'],
        ['Permission audit', 'Which apps can use the camera, microphone, location and more.'],
        ['Hardware test', '13 guided checks for screen, touch, sound, sensors and buttons.'],
        ['Network', 'Connection details, speed test, ping and DNS records.'],
        ['Recover', 'Find deleted photos and files still in trash and recycle folders.'],
        ['App trackers', 'See the tracking and ad libraries inside any installed app.'],
        ['F-Droid', 'Browse, install and update open-source apps on the phone.'],
        ['Zip files', 'Compress and extract zips, with an optional password.'],
      ],
    },

    steps: {
      h: 'How to connect your Android phone to your computer',
      items: [
        ['Install ' + N, 'Download the installer for Windows, macOS or Linux and open it. No drivers, Android SDK or adb to install.'],
        ['Turn on USB debugging', 'On the phone, open Settings › About phone and tap Build number seven times. Then switch on USB debugging under Developer options.'],
        ['Plug in and allow', `Connect the USB cable, click Connect phone in ${N}, and tap Allow on the phone. After the first time it connects by itself whenever you plug the phone in, and you can also connect over Wi‑Fi.`],
      ],
    },

    download: {
      h: 'Download ' + N,
      p: 'Free. No account, no ads.',
      os: [
        { id: 'windows', name: 'Windows', note: '64-bit Intel/AMD and ARM64', kinds: 'Setup .exe' },
        { id: 'mac', name: 'macOS', note: 'Apple Silicon and Intel', kinds: '.dmg' },
        { id: 'linux', name: 'Linux', note: '64-bit', kinds: '.deb and AppImage' },
      ],
    },

    // The /compare/ page. Marks: f = covers it, p = partly, n = doesn't; text after "|" replaces the
    // mark's word. Keep it factual and check competitors' sites before changing a mark.
    compare: {
      title: 'Andromon vs AirDroid, Phone Link, Vysor and scrcpy',
      description: 'Compare Andromon with AirDroid, Microsoft Phone Link, Vysor, scrcpy and paid phone-manager suites: features, platforms and privacy, side by side.',
      kicker: 'Compare',
      h1: 'How Andromon compares',
      lead: `${N} puts screen mirroring, messages, files, backup, app cleanup and developer tools in one free desktop app for Windows, macOS and Linux, and connects without an account. Here is how it lines up with the tools people often use instead.`,
      asOf: 'November 2026',
      columns: [
        [N, 'Free'],
        ['AirDroid Personal', 'Free and paid plans'],
        ['Microsoft Phone Link', 'Free with Windows'],
        ['Vysor', 'Free and paid plans'],
        ['scrcpy', 'Free, open source'],
        ['Paid suites', 'Dr.Fone, Coolmuster, MobiKin'],
      ],
      rows: [
        ["See and control the phone's screen", 'f', 'f', 'p|Select phones only', 'f', 'f', 'n|Sold separately'],
        ['Read and send texts from the computer', 'f', 'f', 'f', 'n', 'n', 'p'],
        ['Phone notifications on the computer', 'f', 'f', 'f', 'n', 'n', 'n'],
        ['Move files and photos', 'f', 'f', 'p', 'p|Drag and drop', 'p|Drag and drop', 'f'],
        ['Back up and restore', 'f', 'p|Photos and files', 'n', 'n', 'n', 'f'],
        ['Remove pre-installed apps without root', 'f', 'n', 'n', 'n', 'n', 'n'],
        ['Install and manage apps', 'f', 'p', 'n', 'n', 'p|Install only', 'f'],
        ['Recover deleted files', 'p|SD cards and trash folders', 'n', 'n', 'n', 'n', 'p|Separate product'],
        ['Developer and testing tools', 'f|Tests, API calls, performance', 'n', 'n', 'n', 'n', 'n'],
        ['Phone-care app on the phone', 'f', 'n', 'n', 'n', 'n', 'n'],
        ['Windows, macOS and Linux', 'f', 'p|Linux in the browser', 'n|Windows only', 'f', 'f', 'p|Windows and macOS'],
        ['Works without an account', 'f', 'n|AirDroid account', 'n|Microsoft account', 'p|Free plan does', 'f', 'f|Licence key only'],
      ],
      why: [
        ['wifi', 'No account, no cloud', 'The phone and the computer talk directly, over the USB cable or your own Wi‑Fi. Nothing goes through our servers, because there are none.'],
        ['screen', 'Windows, macOS and Linux', 'The same app on all three, so it moves with you between computers.'],
        ['grid', 'Everything in one window', 'Mirroring, messages, files, backup, app cleanup, recovery and developer tools, instead of a separate tool for each.'],
        ['broom', 'No root needed', 'Even removing pre-installed apps works on a normal phone, and anything removed can be brought back.'],
      ],
      alternatives: [
        ['AirDroid Personal', 'Remote access, mirroring, texts and file transfer through an AirDroid account. The free plan limits remote data each month.',
          `connects straight to your phone over USB or your own Wi‑Fi, with no account, and adds backup, app cleanup and developer tools.`],
        ['Microsoft Phone Link', 'Texts, calls, notifications and photos on Windows, with a Microsoft account. Seeing the phone\'s screen works on select phones.',
          `works with any Android phone, on Windows, macOS and Linux, and also handles backup, apps and screen mirroring.`],
        ['Vysor', 'Screen mirroring and control, with paid plans for higher quality and wireless use.',
          `mirrors with phone sound and MP4 recording at no cost, and manages the rest of the phone too.`],
        ['scrcpy', 'Free, open-source mirroring started from the command line. It is also the engine behind ' + N + '\'s screen mirror.',
          `gives scrcpy's mirroring a full window with buttons, recording and settings, next to every other tool.`],
        ['Dr.Fone, Coolmuster, MobiKin', 'Paid desktop suites for backup, contacts, messages and transfers, with data recovery often sold separately.',
          `does this for free, adds live mirroring, notifications and app cleanup, and runs on Linux too.`],
        ['Samsung Smart Switch, Xiaomi, HiSuite', 'Each phone maker\'s own free tool for backup and transfer, made for that maker\'s phones.',
          `works with every Android brand, and adds mirroring, messages, notifications and app cleanup.`],
      ],
      builtOn: [
        ['scrcpy', 'Runs the screen mirror, sound and recording.'],
        ['Universal Android Debloater', 'Its community list explains each pre-installed app and how safe it is to remove.'],
        ['LocalSend', 'Wi‑Fi transfer speaks its open protocol, so it also works with the LocalSend app.'],
        ['PhotoRec', 'Does the work of SD card recovery.'],
        ['F-Droid', 'The catalogue of open-source apps you can browse and install.'],
        ['ReVanced', 'Patches apps on the computer.'],
      ],
      legal: 'AirDroid, Phone Link, Vysor, Dr.Fone, Coolmuster, MobiKin and the other names on this page are trademarks of their owners. ' + N + ' is not affiliated with them. The comparison is based on each product\'s public information and may change; check their websites for the latest.',
    },

    faq: [
      [`What is ${N}?`,
        `${N} is a desktop app for managing an Android phone from a computer. It shows the phone's messages, contacts, calls, files, photos, music and apps in one window, mirrors the screen, and makes backups. It runs on Windows, macOS and Linux.`],
      [`Is ${N} free?`,
        `Yes. ${N} is free to download and use. There is no account, no subscription and no advertising.`],
      ['Which phones and computers does it work with?',
        `Any Android phone or tablet with USB debugging turned on. The companion app needs Android 8.0 or later, and connecting over Wi‑Fi needs Android 11 or later. On the computer, ${N} runs on Windows (64-bit Intel/AMD and ARM64), macOS (Apple Silicon and Intel) and 64-bit Linux.`],
      ['Do I need to root my phone?',
        'No. Everything works on a normal, unrooted phone, including removing pre-installed apps.'],
      ['Do I have to install anything on the phone?',
        `Not to connect. Screen mirror, files, apps and controls work straight away. For messages, contacts, call log, calendar, photos and notifications, ${N} offers to install its small companion app over the cable, and sets up its permissions for you.`],
      ['Can I connect without a USB cable?',
        `Yes, on Android 11 and later. Connect the cable once and click "Use this phone without the cable", or pair by scanning a QR code with the phone's Wireless debugging setting. After that the phone connects over Wi‑Fi with one click.`],
      ['What if Android Studio or adb is already using the phone?',
        `Only one program at a time can use a phone's USB debugging connection. When you connect, ${N} closes adb in other programs (the Android SDK, Android Studio, scrcpy) and keeps it closed while the phone is connected. It never closes a browser or your other apps. If you use Android Studio alongside ${N}, turn this off in Settings › Phone link.`],
      ['Can it recover deleted photos?',
        `From an SD card or USB stick, yes: the SD card recovery page uses the free PhotoRec tool to find deleted photos, videos and files on a card in your computer's card reader, without changing the card. A phone's built-in storage is encrypted and wipes deleted space, so nothing can undelete it, but the companion app finds photos still in trash and recycle folders.`],
      ['Where does my data go?',
        `Straight between your phone and your computer, over the USB cable or your own Wi‑Fi network. ${N} has no accounts and no cloud storage. It uses the internet only for things you ask for, such as downloading the F-Droid catalogue or the debloat list, and to check for updates.`],
      ['Is it safe to remove pre-installed apps?',
        `${N} labels each pre-installed app as Recommended, Advanced, Expert or Unsafe to remove, using a community-maintained list. Apps are removed for your user only, so you can restore them from the same page, and a factory reset brings everything back.`],
      ['Can I mirror my Android screen and control it with a mouse and keyboard?',
        'Yes. Screen mirror shows the phone live in a window. Clicking is a tap, the scroll wheel scrolls, and the keyboard types on the phone. Sound from the phone needs Android 11 or later.'],
      ['Can I make the text bigger or turn off animations?',
        `Yes. Settings has accessibility options: four text sizes, high contrast, reduced motion, bold text, a plain system font, a strong keyboard focus outline and underlined links. High contrast and reduced motion can follow your computer's settings.`],
      ['Does it work with iPhone?',
        `No. ${N} is for Android phones and tablets only.`],
    ],
  };
};
