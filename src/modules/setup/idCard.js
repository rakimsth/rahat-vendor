import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IoCamera } from 'react-icons/io5';
import { BiReset } from 'react-icons/bi';
import Webcam from 'react-webcam';
import Swal from 'sweetalert2';

import Loading from '../global/Loading';
import Wallet from '../../utils/blockchain/wallet';
import { AppContext } from '../../contexts/AppContext';
import DataService from '../../services/db';

export default function Main() {
	const history = useHistory();
	const { setHasWallet, setWallet, registerToAgency } = useContext(AppContext);
	const [loadingModal, setLoadingModal] = useState(false);
	const [loadingMessage] = useState('Finishing setup. Please wait...');
	const [videoConstraints] = useState({
		facingMode: 'environment',
		height: 50
	});
	const [previewImage, setPreviewImage] = useState('');
	const webcamRef = React.useRef(null);

	const capture = () => {
		const imageSrc = webcamRef.current.getScreenshot();
		// fetch(imageSrc)
		// 	.then(res => {
		// 		const result = res.blob();
		// 		resolve(result);
		// 	})
		// 	.catch(err => reject(err));
		setPreviewImage(imageSrc);
	};

	const getProfile = async () => {
		const profile = await DataService.getProfile();
		return {
			name: profile.fullName,
			phone: profile.phone,
			email: profile.email,
			address: profile.address,
			govt_id: profile.email
		};
	};

	const save = async event => {
		event.preventDefault();
		setLoadingModal(true);
		try {
			const wallet = await DataService.getWallet();
			if (wallet) {
				history.push('/');
				return;
			}
			const profile = await DataService.get('profile');
			if (!profile.phone) {
				history.push('/setup/profile');
				return;
			}
			await DataService.saveProfileIdCard(previewImage);

			const res = await Wallet.create(profile.phone);
			if (res) {
				const { wallet, encryptedWallet } = res;
				const profile = await getProfile();
				profile.wallet_address = wallet.address;
				await registerToAgency(profile);
				await DataService.saveWallet(encryptedWallet);
				DataService.saveAddress(wallet.address);
				setWallet(wallet);
				setHasWallet(true);
				history.push('/');
			}
		} catch (err) {
			Swal.fire('ERROR', err.message, 'error');
			setLoadingModal(false);
		}
	};

	useEffect(() => {
		// setVideoConstraints({
		// 	width: camContainerRef.current.offsetWidth * 0.84,
		// 	height: camContainerRef.current.offsetWidth * 0.84,
		// 	facingMode: 'user'
		// });
	}, []);

	return (
		<>
			<Loading message={loadingMessage} showModal={loadingModal} />
			<div className="section">
				<div className="text-center p-2">
					<img src="/assets/img/brand/logo-512.png" alt="alt" width="130" />
				</div>
				<div className="card1">
					<div className="card-body text-center">
						<h3 className="mb-2">
							Take a picture of your ID card
							<small>
								<br />
								Citizenship, Passport, License or National ID
							</small>
						</h3>

						{previewImage ? (
							<img
								alt="preview"
								src={previewImage}
								style={{
									borderRadius: '10%',
									width: '100%',
									border: '3px solid #958d9e'
								}}
							/>
						) : (
							<Webcam
								className=""
								audio={false}
								ref={webcamRef}
								screenshotFormat="image/jpeg"
								videoConstraints={videoConstraints}
								style={{
									borderRadius: '10%',
									width: '100%',
									border: '3px solid #958d9e'
								}}
							/>
						)}
					</div>
				</div>
				<div className="pl-5 pr-5">
					{previewImage ? (
						<div className="text-center">
							<button type="button" className="btn btn-lg btn-block btn-success mt-1" onClick={save}>
								Complete setup
							</button>
							<button
								type="button"
								className="btn btn btn-block btn-outline-secondary mt-5"
								style={{ width: 200 }}
								onClick={() => setPreviewImage(null)}
							>
								<BiReset className="ion-icon" />
								Retake Picture
							</button>
						</div>
					) : (
						<button type="button" className="btn btn-lg btn-block btn-dark mt-1" onClick={capture}>
							<IoCamera className="ion-icon" />
							Take Picture
						</button>
					)}
				</div>
			</div>
		</>
	);
}
