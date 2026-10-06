const messages = {
  zh: { tagline:'漫画风卡牌对战', language:'语言', connectWallet:'连接钱包', noWallet:'未连接钱包 · 游玩无需钱包', lobbyKicker:'准备开局', lobbyTitle:'加入牌桌', lobbyDescription:'独自挑战电脑，或邀请朋友进入同一房间。', namePlaceholder:'输入昵称', roomPlaceholder:'房间号（留空创建房间）', join:'加入多人游戏', solo:'开始单人游戏 · 3 位电脑玩家', room:'房间', shareRoom:'把房间号发给朋友，等大家准备好即可开始。', ready:'准备', draw:'摸一张', chooseColor:'选择颜色', yourHand:'你的手牌', confirmResult:'在 Avalanche 上确认赛果', viewTransaction:'查看交易', waiting:'等待开局…', yourTurn:'轮到你了！', playerTurn:name=>`轮到 ${name}`, cards:n=>`${n} 张牌`, readyStatus:'已准备', creator:'房主', createdBy:name=>`由 ${name} 创建`, copied:'已复制', leave:'离开房间', leaveConfirm:'确定要离开房间吗？', nameRequired:'请输入昵称', nameMin:'昵称至少 2 个字符', nameMax:'昵称最多 20 个字符', selectMultiple:n=>`你有 ${n} 张相同类型的牌。要一起出吗？`, sameType:'只能选择相同类型的牌', playCards:n=>`打出 ${n} 张牌`, cancel:'取消选择', wins:name=>`${name} 获胜！`, chainReady:n=>`${n} 位玩家都可以在链上确认赛果。`, soloDone:'单人游戏结束。链上赛果只支持所有真人玩家都连接钱包的房间。', localDone:'本地游戏结束。要上链，请配置合约并让所有玩家在加入前连接钱包。', txPending:'请在钱包中确认交易…', finalized:'所有玩家已确认，赛果已经上链。', confirmations:(n,total)=>`${n}/${total} 位玩家已确认，其余玩家可在各自页面确认。` },
  en: { tagline:'Comic card showdown', language:'Language', connectWallet:'Connect wallet', noWallet:'No wallet connected · optional for play', lobbyKicker:'Ready to play', lobbyTitle:'Join the table', lobbyDescription:'Challenge three bots or invite friends to a room.', namePlaceholder:'Your name', roomPlaceholder:'Room code (blank to create)', join:'Join multiplayer', solo:'Play solo · 3 bots', room:'Room', shareRoom:'Share this code with friends. The game starts when everyone is ready.', ready:'Ready', draw:'Draw a card', chooseColor:'Choose a color', yourHand:'Your hand', confirmResult:'Confirm result on Avalanche', viewTransaction:'View transaction', waiting:'Waiting to start…', yourTurn:'Your turn!', playerTurn:name=>`${name}'s turn`, cards:n=>`${n} cards`, readyStatus:'Ready', creator:'Host', createdBy:name=>`Created by ${name}`, copied:'Copied', leave:'Leave room', leaveConfirm:'Leave this room?', nameRequired:'Enter your name', nameMin:'Name must be at least 2 characters', nameMax:'Name must be 20 characters or fewer', selectMultiple:n=>`You have ${n} cards of the same type. Play them together?`, sameType:'Select cards of the same type', playCards:n=>`Play ${n} cards`, cancel:'Cancel selection', wins:name=>`${name} wins!`, chainReady:n=>`All ${n} players can confirm the result on-chain.`, soloDone:'Solo game complete. On-chain results require human players with connected wallets.', localDone:'Local game complete. To record the result on-chain, configure the contract and connect all wallets before joining.', txPending:'Confirm the transaction in your wallet…', finalized:'All players confirmed. Result finalized on-chain.', confirmations:(n,total)=>`${n}/${total} players confirmed. Others can confirm on their screens.` },
  ja: { tagline:'コミック風カードバトル', language:'言語', connectWallet:'ウォレット接続', noWallet:'未接続 · プレイには不要', lobbyKicker:'ゲーム開始', lobbyTitle:'テーブルに参加', lobbyDescription:'3人のボットと対戦、または友達を招待。', namePlaceholder:'名前を入力', roomPlaceholder:'ルームコード（空欄で作成）', join:'マルチプレイに参加', solo:'ソロプレイ · ボット3人', room:'ルーム', shareRoom:'コードを友達に共有。全員の準備後に開始します。', ready:'準備完了', draw:'カードを引く', chooseColor:'色を選ぶ', yourHand:'自分の手札', confirmResult:'Avalancheで結果を確認', viewTransaction:'取引を見る', waiting:'開始を待っています…', yourTurn:'あなたの番！', playerTurn:name=>`${name} の番`, cards:n=>`${n} 枚`, readyStatus:'準備完了', creator:'ホスト', createdBy:name=>`${name} が作成`, copied:'コピーしました', leave:'退出', leaveConfirm:'ルームを退出しますか？', nameRequired:'名前を入力してください', nameMin:'名前は2文字以上です', nameMax:'名前は20文字以内です', selectMultiple:n=>`同じ種類のカードが${n}枚あります。一緒に出しますか？`, sameType:'同じ種類のカードを選択してください', playCards:n=>`${n}枚を出す`, cancel:'選択を解除', wins:name=>`${name} の勝ち！`, chainReady:n=>`${n}人全員が結果をチェーン上で確認できます。`, soloDone:'ソロゲーム終了。チェーン上の記録には全員のウォレット接続が必要です。', localDone:'ゲーム終了。記録するにはコントラクトを設定し、参加前に全員がウォレットを接続してください。', txPending:'ウォレットで取引を確認してください…', finalized:'全員が確認し、結果が確定しました。', confirmations:(n,total)=>`${total}人中${n}人が確認しました。` },
  ko: { tagline:'만화풍 카드 대결', language:'언어', connectWallet:'지갑 연결', noWallet:'지갑 미연결 · 플레이에는 불필요', lobbyKicker:'게임 준비', lobbyTitle:'테이블 입장', lobbyDescription:'봇 3명과 대결하거나 친구를 초대하세요.', namePlaceholder:'이름 입력', roomPlaceholder:'방 코드 (비워두면 생성)', join:'멀티플레이 입장', solo:'혼자 하기 · 봇 3명', room:'방', shareRoom:'친구에게 코드를 공유하세요. 모두 준비하면 시작합니다.', ready:'준비 완료', draw:'카드 뽑기', chooseColor:'색상 선택', yourHand:'내 카드', confirmResult:'Avalanche에서 결과 확인', viewTransaction:'거래 보기', waiting:'게임 시작 대기 중…', yourTurn:'내 차례!', playerTurn:name=>`${name} 차례`, cards:n=>`${n}장`, readyStatus:'준비 완료', creator:'방장', createdBy:name=>`${name} 생성`, copied:'복사됨', leave:'방 나가기', leaveConfirm:'방을 나가시겠습니까?', nameRequired:'이름을 입력하세요', nameMin:'이름은 2자 이상이어야 합니다', nameMax:'이름은 20자 이하여야 합니다', selectMultiple:n=>`같은 종류 카드가 ${n}장 있습니다. 함께 내시겠습니까?`, sameType:'같은 종류의 카드만 선택하세요', playCards:n=>`${n}장 내기`, cancel:'선택 취소', wins:name=>`${name} 승리!`, chainReady:n=>`${n}명 모두 온체인에서 결과를 확인할 수 있습니다.`, soloDone:'혼자 하기 종료. 온체인 기록에는 모든 플레이어의 지갑 연결이 필요합니다.', localDone:'게임 종료. 온체인 기록을 위해 계약 설정과 모든 플레이어의 지갑 연결이 필요합니다.', txPending:'지갑에서 거래를 확인하세요…', finalized:'모든 플레이어가 확인했습니다.', confirmations:(n,total)=>`${total}명 중 ${n}명이 확인했습니다.` },
  es: { tagline:'Duelo de cartas estilo cómic', language:'Idioma', connectWallet:'Conectar cartera', noWallet:'Sin cartera · no hace falta para jugar', lobbyKicker:'A jugar', lobbyTitle:'Únete a la mesa', lobbyDescription:'Juega contra tres bots o invita a tus amigos.', namePlaceholder:'Tu nombre', roomPlaceholder:'Código de sala (vacío para crear)', join:'Jugar con amigos', solo:'Jugar solo · 3 bots', room:'Sala', shareRoom:'Comparte el código. La partida comienza cuando todos estén listos.', ready:'Listo', draw:'Robar carta', chooseColor:'Elige un color', yourHand:'Tus cartas', confirmResult:'Confirmar resultado en Avalanche', viewTransaction:'Ver transacción', waiting:'Esperando el inicio…', yourTurn:'¡Tu turno!', playerTurn:name=>`Turno de ${name}`, cards:n=>`${n} cartas`, readyStatus:'Listo', creator:'Anfitrión', createdBy:name=>`Creada por ${name}`, copied:'Copiado', leave:'Salir de la sala', leaveConfirm:'¿Salir de la sala?', nameRequired:'Escribe tu nombre', nameMin:'El nombre debe tener al menos 2 caracteres', nameMax:'El nombre debe tener 20 caracteres o menos', selectMultiple:n=>`Tienes ${n} cartas del mismo tipo. ¿Jugarlas juntas?`, sameType:'Selecciona cartas del mismo tipo', playCards:n=>`Jugar ${n} cartas`, cancel:'Cancelar selección', wins:name=>`¡Gana ${name}!`, chainReady:n=>`Los ${n} jugadores pueden confirmar el resultado en la cadena.`, soloDone:'Partida individual terminada. El resultado en cadena requiere jugadores humanos con cartera.', localDone:'Partida terminada. Para registrar el resultado, configura el contrato y conecta las carteras antes de entrar.', txPending:'Confirma la transacción en tu cartera…', finalized:'Todos confirmaron el resultado.', confirmations:(n,total)=>`${n}/${total} jugadores confirmaron. Los demás pueden hacerlo en sus pantallas.` }
};

const avatarText = {
  zh: { createAvatar:'设计美漫像素英雄', avatarTitle:'设计你的美漫像素英雄', randomAvatar:'随机生成', saveAvatar:'保存角色', presetGuardian:'守护者', presetSpark:'电光', presetShadow:'暗影', suitStyle:'战衣款式', suitColor:'战衣主色', accentColor:'装饰颜色', cape:'披风', mask:'面罩', emblem:'胸前徽记', faceShape:'脸型', eyes:'眼睛', mouth:'嘴型', hair:'发型', accessories:'配饰', skinColor:'肤色', hairColor:'发色' },
  en: { createAvatar:'Create a comic pixel hero', avatarTitle:'Create your comic pixel hero', randomAvatar:'Randomize', saveAvatar:'Save character', presetGuardian:'Guardian', presetSpark:'Spark', presetShadow:'Shadow', suitStyle:'Suit style', suitColor:'Suit color', accentColor:'Accent color', cape:'Cape', mask:'Mask', emblem:'Chest emblem', faceShape:'Face', eyes:'Eyes', mouth:'Mouth', hair:'Hair', accessories:'Accessory', skinColor:'Skin tone', hairColor:'Hair color' },
  ja: { createAvatar:'コミック風ヒーローを作る', avatarTitle:'ピクセルヒーローを作る', randomAvatar:'ランダム', saveAvatar:'保存する', presetGuardian:'ガーディアン', presetSpark:'スパーク', presetShadow:'シャドウ', suitStyle:'スーツ', suitColor:'メインカラー', accentColor:'アクセント', cape:'マント', mask:'マスク', emblem:'胸のマーク', faceShape:'顔の形', eyes:'目', mouth:'口', hair:'髪型', accessories:'アクセサリー', skinColor:'肌の色', hairColor:'髪の色' },
  ko: { createAvatar:'코믹 픽셀 히어로 만들기', avatarTitle:'픽셀 히어로 만들기', randomAvatar:'무작위', saveAvatar:'캐릭터 저장', presetGuardian:'가디언', presetSpark:'스파크', presetShadow:'섀도', suitStyle:'슈트', suitColor:'슈트 색상', accentColor:'포인트 색상', cape:'망토', mask:'마스크', emblem:'가슴 문양', faceShape:'얼굴형', eyes:'눈', mouth:'입', hair:'머리', accessories:'액세서리', skinColor:'피부색', hairColor:'머리색' },
  es: { createAvatar:'Crear héroe píxel de cómic', avatarTitle:'Crea tu héroe píxel', randomAvatar:'Aleatorio', saveAvatar:'Guardar personaje', presetGuardian:'Guardián', presetSpark:'Chispa', presetShadow:'Sombra', suitStyle:'Traje', suitColor:'Color del traje', accentColor:'Color de acento', cape:'Capa', mask:'Máscara', emblem:'Emblema', faceShape:'Rostro', eyes:'Ojos', mouth:'Boca', hair:'Pelo', accessories:'Accesorio', skinColor:'Piel', hairColor:'Color de pelo' }
};
for (const [code, labels] of Object.entries(avatarText)) Object.assign(messages[code], labels);
Object.assign(messages.zh, { saveAvatar:'保存到游戏', exportAvatar:'导出 PNG' });
Object.assign(messages.en, { saveAvatar:'Use in game', exportAvatar:'Export PNG' });
Object.assign(messages.ja, { saveAvatar:'ゲームで使う', exportAvatar:'PNGを書き出す' });
Object.assign(messages.ko, { saveAvatar:'게임에서 사용', exportAvatar:'PNG 내보내기' });
Object.assign(messages.es, { saveAvatar:'Usar en el juego', exportAvatar:'Exportar PNG' });
Object.assign(messages.zh, { heroLibrary:'我的角色库', newHero:'新角色', heroName:'角色名字', heroNamePlaceholder:'给角色起名', heroDefaultName:n=>`英雄 ${n}` });
Object.assign(messages.en, { heroLibrary:'My characters', newHero:'New', heroName:'Character name', heroNamePlaceholder:'Name this character', heroDefaultName:n=>`Hero ${n}` });
Object.assign(messages.ja, { heroLibrary:'マイキャラクター', newHero:'新規', heroName:'名前', heroNamePlaceholder:'キャラクターの名前', heroDefaultName:n=>`ヒーロー ${n}` });
Object.assign(messages.ko, { heroLibrary:'내 캐릭터', newHero:'새 캐릭터', heroName:'캐릭터 이름', heroNamePlaceholder:'이름 입력', heroDefaultName:n=>`히어로 ${n}` });
Object.assign(messages.es, { heroLibrary:'Mis personajes', newHero:'Nuevo', heroName:'Nombre', heroNamePlaceholder:'Nombre del personaje', heroDefaultName:n=>`Héroe ${n}` });
Object.assign(messages.zh, { pose:'角色姿态' });
Object.assign(messages.en, { pose:'Pose' });
Object.assign(messages.ja, { pose:'ポーズ' });
Object.assign(messages.ko, { pose:'자세' });
Object.assign(messages.es, { pose:'Pose' });
Object.assign(messages.zh, { passTurn:'保留这张牌', catchUno:'举报漏喊 UNO', scoreHeader:'本局 / 累计负分' });
Object.assign(messages.en, { passTurn:'Keep card', catchUno:'Catch missed UNO', scoreHeader:'Round / total penalty' });
Object.assign(messages.ja, { passTurn:'カードを残す', catchUno:'UNO忘れを指摘', scoreHeader:'今回 / 累計失点' });
Object.assign(messages.ko, { passTurn:'카드 보유', catchUno:'UNO 미선언 신고', scoreHeader:'이번 판 / 누적 감점' });
Object.assign(messages.es, { passTurn:'Conservar carta', catchUno:'Avisar UNO omitido', scoreHeader:'Ronda / penalización total' });
Object.assign(messages.zh, { matchHistory:'比赛记录', historySummary:(w,l,i)=>`近100局 · 胜 ${w} / 负 ${l} / 中断 ${i}`, historyEmpty:'还没有比赛记录。完成一局后会显示在这里。', historyWin:'胜', historyLoss:'负', historyInterrupted:'中断', historyVs:names=>`对手：${names}` });
Object.assign(messages.en, { matchHistory:'Match history', historySummary:(w,l,i)=>`Last 100 · ${w} wins / ${l} losses / ${i} interrupted`, historyEmpty:'No matches yet. Finish a game to see it here.', historyWin:'Win', historyLoss:'Loss', historyInterrupted:'Interrupted', historyVs:names=>`vs ${names}` });
Object.assign(messages.ja, { matchHistory:'対戦履歴', historySummary:(w,l,i)=>`直近100戦 · ${w}勝 / ${l}敗 / 中断${i}`, historyEmpty:'対戦履歴はまだありません。', historyWin:'勝利', historyLoss:'敗北', historyInterrupted:'中断', historyVs:names=>`対戦相手：${names}` });
Object.assign(messages.ko, { matchHistory:'경기 기록', historySummary:(w,l,i)=>`최근 100경기 · ${w}승 / ${l}패 / 중단 ${i}`, historyEmpty:'아직 경기 기록이 없습니다.', historyWin:'승', historyLoss:'패', historyInterrupted:'중단', historyVs:names=>`상대: ${names}` });
Object.assign(messages.es, { matchHistory:'Historial de partidas', historySummary:(w,l,i)=>`Últimas 100 · ${w} victorias / ${l} derrotas / ${i} interrumpidas`, historyEmpty:'Aún no hay partidas registradas.', historyWin:'Victoria', historyLoss:'Derrota', historyInterrupted:'Interrumpida', historyVs:names=>`Rivales: ${names}` });
Object.assign(messages.zh, { quickMatch:'快速匹配 · 4 人桌', cancelMatch:'取消匹配', queueStatus:n=>`正在匹配：${n}/4 人` });
Object.assign(messages.en, { quickMatch:'Quick match · 4 players', cancelMatch:'Cancel', queueStatus:n=>`Finding players: ${n}/4` });
Object.assign(messages.ja, { quickMatch:'クイックマッチ · 4人', cancelMatch:'キャンセル', queueStatus:n=>`マッチング中：${n}/4人` });
Object.assign(messages.ko, { quickMatch:'빠른 매칭 · 4명', cancelMatch:'취소', queueStatus:n=>`매칭 중: ${n}/4명` });
Object.assign(messages.es, { quickMatch:'Partida rápida · 4 jugadores', cancelMatch:'Cancelar', queueStatus:n=>`Buscando jugadores: ${n}/4` });
Object.assign(messages.zh, { wild4Prompt:'有人打出了 +4，你要接受还是质疑？', acceptWild4:'接受，摸 4 张', challengeWild4:'质疑 +4' });
Object.assign(messages.en, { wild4Prompt:'A +4 was played. Accept or challenge?', acceptWild4:'Accept: draw 4', challengeWild4:'Challenge +4' });
Object.assign(messages.ja, { wild4Prompt:'+4が出されました。受け入れますか？', acceptWild4:'受け入れて4枚引く', challengeWild4:'+4に異議' });
Object.assign(messages.ko, { wild4Prompt:'+4가 나왔습니다. 수락하거나 도전하세요.', acceptWild4:'수락하고 4장 뽑기', challengeWild4:'+4 이의 제기' });
Object.assign(messages.es, { wild4Prompt:'Han jugado un +4. ¿Aceptas o desafías?', acceptWild4:'Aceptar: robar 4', challengeWild4:'Desafiar +4' });
Object.assign(messages.zh, { walletHistory:'钱包战绩（跨设备）', walletHistoryEmpty:'连接钱包后查看跨设备战绩。', leaderboard:'公开排行榜', leaderboardEmpty:'还没有钱包战绩。', leaderboardScore:(w,l)=>`胜 ${w} / 负 ${l}` });
Object.assign(messages.en, { walletHistory:'Wallet history (across devices)', walletHistoryEmpty:'Connect a wallet to see your history.', leaderboard:'Leaderboard', leaderboardEmpty:'No wallet results yet.', leaderboardScore:(w,l)=>`${w} wins / ${l} losses` });
Object.assign(messages.ja, { walletHistory:'ウォレット戦績', walletHistoryEmpty:'ウォレット接続後に表示します。', leaderboard:'ランキング', leaderboardEmpty:'戦績はまだありません。', leaderboardScore:(w,l)=>`${w}勝 / ${l}敗` });
Object.assign(messages.ko, { walletHistory:'지갑 전적', walletHistoryEmpty:'지갑을 연결하면 전적을 볼 수 있습니다.', leaderboard:'순위표', leaderboardEmpty:'아직 전적이 없습니다.', leaderboardScore:(w,l)=>`${w}승 / ${l}패` });
Object.assign(messages.es, { walletHistory:'Historial de cartera', walletHistoryEmpty:'Conecta una cartera para ver tus partidas.', leaderboard:'Clasificación', leaderboardEmpty:'Todavía no hay resultados.', leaderboardScore:(w,l)=>`${w} victorias / ${l} derrotas` });
Object.assign(messages.zh, { autoChainPending:'服务器正在将赛果写入 Avalanche…', autoChainRecorded:'赛果已写入 Avalanche。', autoChainFailed:'链上记录暂时失败；服务器会在重启后重试。' });
Object.assign(messages.en, { autoChainPending:'Recording the result on Avalanche…', autoChainRecorded:'Result recorded on Avalanche.', autoChainFailed:'On-chain recording failed for now; the server will retry after restart.' });
Object.assign(messages.ja, { autoChainPending:'結果をAvalancheに記録中…', autoChainRecorded:'Avalancheに記録しました。', autoChainFailed:'記録に失敗しました。サーバー再起動後に再試行します。' });
Object.assign(messages.ko, { autoChainPending:'결과를 Avalanche에 기록 중…', autoChainRecorded:'Avalanche에 결과가 기록되었습니다.', autoChainFailed:'기록에 실패했습니다. 서버 재시작 후 다시 시도합니다.' });
Object.assign(messages.es, { autoChainPending:'Registrando el resultado en Avalanche…', autoChainRecorded:'Resultado registrado en Avalanche.', autoChainFailed:'Falló el registro; el servidor reintentará tras reiniciarse.' });
Object.assign(messages.zh, { recordedOnChain:'已上链' });
Object.assign(messages.en, { recordedOnChain:'On-chain' });
Object.assign(messages.ja, { recordedOnChain:'チェーン記録済み' });
Object.assign(messages.ko, { recordedOnChain:'온체인 기록' });
Object.assign(messages.es, { recordedOnChain:'En cadena' });
Object.assign(messages.zh, { rankedMatch:'排位赛', casualMatch:'休闲局' });
Object.assign(messages.en, { rankedMatch:'Ranked', casualMatch:'Casual' });
Object.assign(messages.ja, { rankedMatch:'ランク戦', casualMatch:'カジュアル' });
Object.assign(messages.ko, { rankedMatch:'랭크전', casualMatch:'친선전' });
Object.assign(messages.es, { rankedMatch:'Clasificatoria', casualMatch:'Casual' });
Object.assign(messages.zh, { musicOn:'♫ 开启音乐', musicOff:'♫ 关闭音乐' });
Object.assign(messages.en, { musicOn:'♫ Music on', musicOff:'♫ Music off' });
Object.assign(messages.ja, { musicOn:'♫ 音楽を再生', musicOff:'♫ 音楽を停止' });
Object.assign(messages.ko, { musicOn:'♫ 음악 켜기', musicOff:'♫ 음악 끄기' });
Object.assign(messages.es, { musicOn:'♫ Activar música', musicOff:'♫ Desactivar música' });
Object.assign(messages.zh, { lobbyTitle:'选择玩法', lobbyDescription:'和朋友、陌生玩家，或电脑对战。', homeProfile:'我的角色', homeRecords:'战绩大厅' });
Object.assign(messages.en, { lobbyTitle:'Choose a game', lobbyDescription:'Play with friends, new players, or bots.', homeProfile:'My character', homeRecords:'Records' });
Object.assign(messages.ja, { lobbyTitle:'モードを選ぶ', lobbyDescription:'友達、ほかのプレイヤー、ボットと対戦。', homeProfile:'マイキャラクター', homeRecords:'対戦記録' });
Object.assign(messages.ko, { lobbyTitle:'게임 선택', lobbyDescription:'친구, 다른 플레이어 또는 봇과 대전하세요.', homeProfile:'내 캐릭터', homeRecords:'전적' });
Object.assign(messages.es, { lobbyTitle:'Elige una partida', lobbyDescription:'Juega con amigos, otros jugadores o bots.', homeProfile:'Mi personaje', homeRecords:'Resultados' });
Object.assign(messages.zh, { musicVisualizer:'音乐律动' });
Object.assign(messages.en, { musicVisualizer:'Music pulse' });
Object.assign(messages.ja, { musicVisualizer:'音楽ビジュアル' });
Object.assign(messages.ko, { musicVisualizer:'음악 비주얼' });
Object.assign(messages.es, { musicVisualizer:'Ritmo musical' });
Object.assign(messages.zh, { gameMenu:'☰ 菜单', gameMenuTitle:'对局菜单', gameMenuNote:'打开菜单时，回合计时仍会继续。', continueGame:'继续对局', backHome:'返回首页', exitGameWarning:'离开将中断本局，且无法上链记录这局赛果。确定返回首页吗？', stayGame:'留在牌桌', confirmExit:'确认离开', closeMenu:'关闭菜单' });
Object.assign(messages.en, { gameMenu:'☰ Menu', gameMenuTitle:'Game menu', gameMenuNote:'The turn timer continues while this menu is open.', continueGame:'Continue game', backHome:'Back to home', exitGameWarning:'Leaving interrupts this match and prevents its result from being recorded on-chain. Return home?', stayGame:'Stay at table', confirmExit:'Leave game', closeMenu:'Close menu' });
Object.assign(messages.ja, { gameMenu:'☰ メニュー', gameMenuTitle:'対戦メニュー', gameMenuNote:'メニュー中もターンの時間は進みます。', continueGame:'対戦を続ける', backHome:'ホームへ戻る', exitGameWarning:'退出するとこの対戦は中断され、結果はチェーンに記録できません。戻りますか？', stayGame:'対戦に戻る', confirmExit:'退出する', closeMenu:'メニューを閉じる' });
Object.assign(messages.ko, { gameMenu:'☰ 메뉴', gameMenuTitle:'게임 메뉴', gameMenuNote:'메뉴가 열려 있어도 턴 시간은 계속 흐릅니다.', continueGame:'게임 계속', backHome:'홈으로', exitGameWarning:'나가면 이번 경기가 중단되고 결과를 온체인에 기록할 수 없습니다. 홈으로 돌아갈까요?', stayGame:'테이블에 남기', confirmExit:'나가기', closeMenu:'메뉴 닫기' });
Object.assign(messages.es, { gameMenu:'☰ Menú', gameMenuTitle:'Menú de partida', gameMenuNote:'El tiempo del turno sigue corriendo.', continueGame:'Seguir jugando', backHome:'Volver al inicio', exitGameWarning:'Salir interrumpe la partida e impide registrar el resultado en cadena. ¿Volver al inicio?', stayGame:'Seguir en la mesa', confirmExit:'Salir', closeMenu:'Cerrar menú' });
Object.assign(messages.zh, { clockwise:'↻ 顺时针', counterclockwise:'↺ 逆时针', playedCard:(name,color,card)=>`${name} 打出 ${color}${card}`, action_draw:name=>`${name} 摸了一张牌`, action_pass:name=>`${name} 保留摸到的牌`, action_challenge:name=>`${name} 质疑 +4`, action_accept:name=>`${name} 接受 +4`, color_red:'红色', color_yellow:'黄色', color_green:'绿色', color_blue:'蓝色', card_reverse:'反转', card_skip:'跳过', card_draw2:'+2', card_wild:'变色', card_wild4:'+4', ...Object.fromEntries(Array.from({length:10},(_,i)=>[`card_${i}`,String(i)])) });
Object.assign(messages.en, { clockwise:'↻ Clockwise', counterclockwise:'↺ Counterclockwise', playedCard:(name,color,card)=>`${name} played ${color} ${card}`, action_draw:name=>`${name} drew a card`, action_pass:name=>`${name} kept the drawn card`, action_challenge:name=>`${name} challenged +4`, action_accept:name=>`${name} accepted +4`, color_red:'red', color_yellow:'yellow', color_green:'green', color_blue:'blue', card_reverse:'Reverse', card_skip:'Skip', card_draw2:'+2', card_wild:'Wild', card_wild4:'+4', ...Object.fromEntries(Array.from({length:10},(_,i)=>[`card_${i}`,String(i)])) });
Object.assign(messages.ja, { clockwise:'↻ 時計回り', counterclockwise:'↺ 反時計回り', playedCard:(name,color,card)=>`${name}：${color}${card}`, action_draw:name=>`${name} が1枚引いた`, action_pass:name=>`${name} がパス`, action_challenge:name=>`${name} が+4に異議`, action_accept:name=>`${name} が+4を受け入れた`, color_red:'赤', color_yellow:'黄', color_green:'緑', color_blue:'青', card_reverse:'リバース', card_skip:'スキップ', card_draw2:'+2', card_wild:'ワイルド', card_wild4:'+4', ...Object.fromEntries(Array.from({length:10},(_,i)=>[`card_${i}`,String(i)])) });
Object.assign(messages.ko, { clockwise:'↻ 시계 방향', counterclockwise:'↺ 반시계 방향', playedCard:(name,color,card)=>`${name}: ${color} ${card}`, action_draw:name=>`${name} 카드 한 장 뽑음`, action_pass:name=>`${name} 턴 넘김`, action_challenge:name=>`${name} +4 도전`, action_accept:name=>`${name} +4 수락`, color_red:'빨강', color_yellow:'노랑', color_green:'초록', color_blue:'파랑', card_reverse:'방향 전환', card_skip:'건너뛰기', card_draw2:'+2', card_wild:'색 변경', card_wild4:'+4', ...Object.fromEntries(Array.from({length:10},(_,i)=>[`card_${i}`,String(i)])) });
Object.assign(messages.es, { clockwise:'↻ Sentido horario', counterclockwise:'↺ Sentido antihorario', playedCard:(name,color,card)=>`${name} jugó ${color} ${card}`, action_draw:name=>`${name} robó una carta`, action_pass:name=>`${name} pasó`, action_challenge:name=>`${name} desafió +4`, action_accept:name=>`${name} aceptó +4`, color_red:'rojo', color_yellow:'amarillo', color_green:'verde', color_blue:'azul', card_reverse:'Reversa', card_skip:'Salto', card_draw2:'+2', card_wild:'Comodín', card_wild4:'+4', ...Object.fromEntries(Array.from({length:10},(_,i)=>[`card_${i}`,String(i)])) });

Object.assign(messages.zh, { shopButton:'✦ 商店', shopTitle:'收藏商店', shopNote:'完成一局得 20 金币，获胜额外得 10 金币。连接钱包后可跨设备保存收藏。', shopBalance:n=>`✦ ${n} 金币`, shopGuest:'连接钱包后可获得金币、解锁并保存外观', shopBack:'牌背', shopOutfit:'角色服装', shopPrice:n=>`${n} 金币`, shopFree:'免费', shopBuy:'解锁', shopEquip:'使用', shopEquipped:'使用中', shop_classic:'四色酒馆', shop_mountain:'雪山之巅', shop_treasure:'黄金秘藏', shop_crystal:'紫晶星网', shop_guardian:'黄金守护者', shop_explorer:'翠影探险家' });
Object.assign(messages.en, { shopButton:'✦ Shop', shopTitle:'Collection Shop', shopNote:'Earn 20 coins for completing a match and 10 more for winning. Connect a wallet to keep your collection across devices.', shopBalance:n=>`✦ ${n} coins`, shopGuest:'Connect a wallet to earn coins and save cosmetics', shopBack:'Card back', shopOutfit:'Outfit', shopPrice:n=>`${n} coins`, shopFree:'Free', shopBuy:'Unlock', shopEquip:'Equip', shopEquipped:'Equipped', shop_classic:'Four Gems', shop_mountain:'Snow Summit', shop_treasure:'Golden Vault', shop_crystal:'Amethyst Network', shop_guardian:'Golden Guardian', shop_explorer:'Emerald Explorer' });
Object.assign(messages.ja, { shopButton:'✦ ショップ', shopTitle:'コレクションショップ', shopNote:'対戦完了で20コイン、勝利でさらに10コイン。ウォレット接続でコレクションを保存。', shopBalance:n=>`✦ ${n} コイン`, shopGuest:'ウォレット接続でコインと外見を保存', shopBack:'カード裏面', shopOutfit:'衣装', shopPrice:n=>`${n} コイン`, shopFree:'無料', shopBuy:'解放', shopEquip:'装備', shopEquipped:'装備中', shop_classic:'四色の宝石', shop_mountain:'雪の頂', shop_treasure:'黄金の宝庫', shop_crystal:'紫水晶の網', shop_guardian:'黄金の守護者', shop_explorer:'翡翠の探検家' });
Object.assign(messages.ko, { shopButton:'✦ 상점', shopTitle:'컬렉션 상점', shopNote:'경기 완료 시 20코인, 승리 시 10코인을 추가로 얻습니다. 지갑 연결로 컬렉션을 저장하세요.', shopBalance:n=>`✦ ${n} 코인`, shopGuest:'지갑을 연결하면 코인과 꾸미기 아이템을 저장할 수 있습니다', shopBack:'카드 뒷면', shopOutfit:'의상', shopPrice:n=>`${n} 코인`, shopFree:'무료', shopBuy:'잠금 해제', shopEquip:'장착', shopEquipped:'장착 중', shop_classic:'네 가지 보석', shop_mountain:'설산 정상', shop_treasure:'황금 보물', shop_crystal:'자수정 회로', shop_guardian:'황금 수호자', shop_explorer:'에메랄드 탐험가' });
Object.assign(messages.es, { shopButton:'✦ Tienda', shopTitle:'Tienda de colección', shopNote:'Gana 20 monedas por terminar una partida y 10 más por ganar. Conecta una cartera para guardar la colección.', shopBalance:n=>`✦ ${n} monedas`, shopGuest:'Conecta una cartera para ganar monedas y guardar aspectos', shopBack:'Reverso', shopOutfit:'Atuendo', shopPrice:n=>`${n} monedas`, shopFree:'Gratis', shopBuy:'Desbloquear', shopEquip:'Equipar', shopEquipped:'Equipado', shop_classic:'Cuatro gemas', shop_mountain:'Cumbre nevada', shop_treasure:'Tesoro dorado', shop_crystal:'Red amatista', shop_guardian:'Guardián dorado', shop_explorer:'Explorador esmeralda' });

Object.assign(messages.zh, { shopOutfitNote:'预览示意，保留自创角色脸和发型' });
Object.assign(messages.en, { shopOutfitNote:'Preview; your face and hair stay' });
Object.assign(messages.ja, { shopOutfitNote:'顔と髪型はそのまま' });
Object.assign(messages.ko, { shopOutfitNote:'얼굴과 머리는 유지' });
Object.assign(messages.es, { shopOutfitNote:'Mantiene tu rostro y pelo' });
Object.assign(messages.zh, { shopNote:'开局前连接钱包：完成一局得 20 金币，获胜额外得 10 金币，收藏可跨设备保存。' });
Object.assign(messages.en, { shopNote:'Connect your wallet before the match: earn 20 coins for finishing and 10 more for winning. Your collection follows your wallet.' });
Object.assign(messages.ja, { shopNote:'対戦前にウォレットを接続。完了で20コイン、勝利でさらに10コイン。コレクションを保存できます。' });
Object.assign(messages.ko, { shopNote:'경기 전에 지갑을 연결하세요. 완료 시 20코인, 승리 시 10코인을 추가로 얻습니다.' });
Object.assign(messages.es, { shopNote:'Conecta la cartera antes de jugar: gana 20 monedas por terminar y 10 más por ganar. La colección queda guardada.' });
Object.assign(messages.zh, { collectionTitle:'我的收藏', collectionOpen:'查看牌背与服装 ›', collectionGuest:'连接钱包查看金币', shopAll:'全部' });
Object.assign(messages.en, { collectionTitle:'My collection', collectionOpen:'View card backs & outfits ›', collectionGuest:'Connect wallet for coins', shopAll:'All' });
Object.assign(messages.ja, { collectionTitle:'マイコレクション', collectionOpen:'カード裏面と衣装を見る ›', collectionGuest:'ウォレット接続でコイン表示', shopAll:'すべて' });
Object.assign(messages.ko, { collectionTitle:'내 컬렉션', collectionOpen:'카드 뒷면과 의상 보기 ›', collectionGuest:'지갑을 연결해 코인 확인', shopAll:'전체' });
Object.assign(messages.es, { collectionTitle:'Mi colección', collectionOpen:'Ver reversos y atuendos ›', collectionGuest:'Conecta la cartera para ver monedas', shopAll:'Todo' });
Object.assign(messages.zh, { closeResult:'关闭结果' });
Object.assign(messages.en, { closeResult:'Close result' });
Object.assign(messages.ja, { closeResult:'結果を閉じる' });
Object.assign(messages.ko, { closeResult:'결과 닫기' });
Object.assign(messages.es, { closeResult:'Cerrar resultado' });

Object.assign(messages.zh, { sfxOn:'🔊 音效开', sfxOff:'🔇 音效关' });
Object.assign(messages.en, { sfxOn:'🔊 Sound on', sfxOff:'🔇 Sound off' });
Object.assign(messages.ja, { sfxOn:'🔊 効果音オン', sfxOff:'🔇 効果音オフ' });
Object.assign(messages.ko, { sfxOn:'🔊 효과음 켜짐', sfxOff:'🔇 효과음 꺼짐' });
Object.assign(messages.es, { sfxOn:'🔊 Sonido activado', sfxOff:'🔇 Sonido desactivado' });
Object.assign(messages.zh, { unoCalled:name=>`${name} 喊了 UNO!` });
Object.assign(messages.en, { unoCalled:name=>`${name} called UNO!` });
Object.assign(messages.ja, { unoCalled:name=>`${name} が UNO!` });
Object.assign(messages.ko, { unoCalled:name=>`${name} UNO!` });
Object.assign(messages.es, { unoCalled:name=>`¡${name} dijo UNO!` });

const saved = localStorage.getItem('color-clash-language');
let language = messages[saved] ? saved : (messages[navigator.language.split('-')[0]] ? navigator.language.split('-')[0] : 'en');

export function t(key, ...args) {
  const value = messages[language][key] ?? messages.en[key];
  return typeof value === 'function' ? value(...args) : value;
}

export function applyLanguage(next = language) {
  language = messages[next] ? next : 'en';
  localStorage.setItem('color-clash-language', language);
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  document.getElementById('language').value = language;
}
